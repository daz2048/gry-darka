#!/usr/bin/env bash

set -euo pipefail

SCRIPT_VERSION='1.2.0'
RESET='' BOLD='' CYAN='' GREEN='' YELLOW='' RED=''
if [ -t 1 ] && [ -n "${TERM:-}" ] && [ "$TERM" != dumb ] && [ -z "${NO_COLOR:-}" ]; then
    RESET=$'\033[0m' BOLD=$'\033[1m' CYAN=$'\033[36m'
    GREEN=$'\033[32m' YELLOW=$'\033[33m' RED=$'\033[31m'
fi

heading() {
    printf '\n%s%s%s%s\n' "$BOLD" "$CYAN" "$1" "$RESET"
}

ok() {
    printf '%s[ OK ]%s %s\n' "$GREEN" "$RESET" "$*"
}

warn() {
    printf '%s[ WARN ]%s %s\n' "$YELLOW" "$RESET" "$*" >&2
}

fail() {
    printf '%s[ ERROR ]%s %s\n' "$RED" "$RESET" "$*" >&2
    exit 1
}

usage() {
    heading 'BROWSER TEST TOOLS // HELP'
    printf 'Usage: %s [--check] [--debug]\n' "$0"
    heading 'Options'
    printf '  %s%-16s%s %s\n' "$GREEN" '--check' "$RESET" 'Check runtimes and cached Playwright/Chromium without installing or downloading.'
    printf '  %s%-16s%s %s\n' "$GREEN" '--debug' "$RESET" 'Show additional diagnostics and output from the offline browser check.'
    printf '  %s%-16s%s %s\n' "$GREEN" '-h, --help' "$RESET" 'Show this help without changing anything.'
    heading 'Installation and repair'
    printf '%s\n' \
        '  With no options, reuse working tools and install missing ones.' \
        '  On macOS, use existing Homebrew to install missing Node.js/Python 3.' \
        '  Upgrade old or reinstall broken Homebrew-managed runtimes once.' \
        '  Never overwrite a non-Homebrew runtime or force-link over another tool.' \
        '  Install Playwright/Chromium in local caches; retry a broken browser with --force.' \
        '  Launch headless Chromium and take a temporary screenshot to verify it works.'
    heading 'TLS and colours'
    printf '%s\n' \
        '  On macOS, use /etc/ssl/cert.pem as additional Node CAs if available and not explicitly configured.' \
        '  TLS verification stays enabled. For a trusted network CA, use:' \
        '    NODE_EXTRA_CA_CERTS=/absolute/path/to/trusted-ca.pem ./scripts/bootstrap-browser-tests.sh' \
        '  Existing npm proxy/cafile settings are respected; no configuration is rewritten.' \
        '  Set NO_COLOR=1 to disable colours. Redirected output and TERM=dumb are plain.'
    heading 'Examples'
    printf '  %s\n' "$0" "$0 --check --debug" "$0 --help"
}

CHECK_ONLY=0
DEBUG=0
while [ "$#" -gt 0 ]; do
    case "$1" in
        --check) CHECK_ONLY=1 ;;
        --debug) DEBUG=1 ;;
        -h|--help) usage; exit 0 ;;
        *) usage >&2; exit 2 ;;
    esac
    shift
done

if [ -z "${NODE_EXTRA_CA_CERTS+x}" ] && [ "$(uname -s)" = Darwin ] && [ -f /etc/ssl/cert.pem ] && [ -r /etc/ssl/cert.pem ]; then
    export NODE_EXTRA_CA_CERTS=/etc/ssl/cert.pem
    printf 'Using macOS certificate bundle: %s\n' "$NODE_EXTRA_CA_CERTS"
fi

heading 'Bootstrap information'
printf 'Script version: %s\n' "$SCRIPT_VERSION"
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)
REPO_DIR=$(cd -- "$SCRIPT_DIR/.." && pwd -P)
if command -v git >/dev/null 2>&1 && git -C "$REPO_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    branch=$(git -C "$REPO_DIR" symbolic-ref --quiet --short HEAD) || branch='(detached HEAD)'
    commit=$(git -C "$REPO_DIR" rev-parse --short HEAD) || fail 'Could not determine Git commit.'
    status=$(git -C "$REPO_DIR" status --porcelain) || fail 'Could not determine Git worktree status.'
    printf 'Branch: %s\nCommit: %s\n' "$branch" "$commit"
    if [ -n "$status" ]; then
        printf 'Worktree: dirty (includes untracked files)\n'
    else
        printf 'Worktree: clean\n'
    fi
else
    warn 'Git repository information is unavailable.'
fi
if [ "$DEBUG" -eq 1 ]; then
    printf 'Debug: enabled\nScript directory: %s\nPlatform: %s\n' "$SCRIPT_DIR" "$(uname -s)"
    printf 'Node path: %s\nnpm path: %s\nPython path: %s\n' \
        "$(command -v node || printf 'not found')" "$(command -v npm || printf 'not found')" \
        "$(command -v python3 || printf 'not found')"
fi

node_works() {
    node -e 'if (Number(process.versions.node.split(".")[0]) < 20) process.exit(1); require("node:test"); require("node:tls")' &&
        npm --version
}

python_works() {
    python3 -c 'import sys, http.server, ssl, venv; print(sys.version.split()[0]); sys.exit(0 if sys.version_info >= (3, 9) else 1)'
}

repair_runtime() {
    local formula=$1 executable=$2 prefix active outdated
    [ "$CHECK_ONLY" -eq 0 ] || fail "$executable is missing, outdated, or broken. Rerun without --check to attempt repair."
    [ "$(uname -s)" = Darwin ] || fail "Install or repair $executable manually on this platform, then rerun."
    command -v brew >/dev/null 2>&1 || fail "Install Homebrew first, or repair $executable manually."
    brew --version >/dev/null || fail 'Homebrew itself is broken; repair it manually before continuing.'

    active=$(command -v "$executable" || true)
    if brew list --formula --versions "$formula" >/dev/null 2>&1; then
        prefix=$(brew --prefix "$formula")
        # Refuse to repair an unrelated installation shadowing Homebrew.
        if [ -n "$active" ] && [ ! "$active" -ef "$prefix/bin/$executable" ]; then
            fail "$active is not managed by the Homebrew $formula formula. Repair it or adjust PATH manually."
        fi
        warn "Repairing Homebrew $formula (upgrade if outdated, otherwise reinstall)."
        outdated=$(brew outdated --formula "$formula") || fail "Could not check Homebrew updates for $formula."
        if [ -n "$outdated" ]; then
            brew upgrade "$formula" || fail "Homebrew could not upgrade $formula."
        else
            brew reinstall "$formula" || fail "Homebrew could not reinstall $formula."
        fi
    else
        [ -z "$active" ] || fail "$active is not managed by Homebrew. Repair it or adjust PATH manually."
        warn "Installing missing Homebrew $formula."
        brew install "$formula" || fail "Homebrew could not install $formula."
    fi
    hash -r
}

heading 'Checking runtimes'
if ! node_works; then
    warn 'Node.js 20+ or npm failed its runtime check.'
    [ "$CHECK_ONLY" -eq 0 ] || fail 'Node.js/npm is missing, outdated, or broken. Rerun without --check to attempt repair.'
    # npm belongs to Node.js; a separately broken npm must not be overwritten.
    if command -v npm >/dev/null 2>&1 && command -v brew >/dev/null 2>&1; then
        node_prefix=$(brew --prefix node)
        npm_path=$(command -v npm)
        [ "$npm_path" -ef "$node_prefix/bin/npm" ] ||
            fail "$npm_path is not managed by the Homebrew node formula. Repair it or adjust PATH manually."
    fi
    repair_runtime node node
    node_works || fail 'Node.js/npm still fails after repair. Check PATH and the errors above.'
fi
ok "Node.js $(node --version) and npm are working."

if ! python_works; then
    warn 'Python 3.9+ or its standard library failed its runtime check.'
    repair_runtime python python3
    python_works || fail 'Python still fails after repair. Check PATH and the errors above.'
fi
ok 'Python and its HTTP/TLS standard library are working.'

WORK_DIR=$(mktemp -d)
trap 'rm -f "$WORK_DIR/smoke.png" "$WORK_DIR/browser-error"; rmdir "$WORK_DIR"' EXIT

browser_works() {
    rm -f "$WORK_DIR/smoke.png"
    if npm exec --offline --no --package=playwright@latest -- \
        playwright screenshot --browser chromium about:blank "$WORK_DIR/smoke.png" 2>"$WORK_DIR/browser-error"; then
        if [ "$DEBUG" -eq 1 ] && [ -s "$WORK_DIR/browser-error" ]; then
            cat "$WORK_DIR/browser-error" >&2
        fi
        if [ -s "$WORK_DIR/smoke.png" ]; then
            return 0
        fi
        warn 'Browser check did not produce a screenshot.'
    else
        if [ "$DEBUG" -eq 0 ] && grep -q 'npm error code ENOTCACHED' "$WORK_DIR/browser-error"; then
            warn 'Playwright is not available in the offline npm cache (ENOTCACHED).'
        else
            warn 'Offline Playwright/Chromium check failed:'
            cat "$WORK_DIR/browser-error" >&2
        fi
    fi
    return 1
}

heading 'Checking Playwright and Chromium'
if browser_works; then
    ok 'Cached Playwright and Chromium passed the browser launch/screenshot check.'
    exit 0
fi
[ "$CHECK_ONLY" -eq 0 ] || fail 'Cached Playwright/Chromium is missing or broken. Rerun without --check to install or repair.'

warn 'Installing Playwright and Chromium into local caches.'
if ! npm exec --yes --package=playwright@latest -- playwright install chromium; then
    fail 'Playwright setup failed. Check the errors above and your network/proxy CA. Use NODE_EXTRA_CA_CERTS for a trusted CA; never disable TLS verification.'
fi
if ! browser_works; then
    warn 'Chromium still fails. Reinstalling its browser files once.'
    npm exec --offline --no --package=playwright@latest -- playwright install --force chromium ||
        fail 'Chromium repair failed. Check download permissions, trusted certificates and available disk space.'
    browser_works || fail 'Chromium still cannot launch after repair. Check the errors above for OS dependencies or permissions.'
fi
ok 'Browser test tools passed the runtime and headless browser checks.'
