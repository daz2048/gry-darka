#!/usr/bin/env bash

set -euo pipefail

usage() {
    cat <<'EOF'
Usage: scripts/bootstrap-browser-tests.sh [--check]

Install the local prerequisites and Playwright Chromium for browser testing.
On macOS, missing Node.js and Python 3 are installed with Homebrew.
--check verifies Node.js, npm, and Python 3 without installing anything.
EOF
}

CHECK_ONLY=0
case "${1:-}" in
    "")
        ;;
    --check)
        CHECK_ONLY=1
        ;;
    -h|--help)
        usage
        exit 0
        ;;
    *)
        usage >&2
        exit 2
        ;;
esac

require_tools() {
    if ! command -v node >/dev/null 2>&1 || ! command -v python3 >/dev/null 2>&1; then
        if [ "$CHECK_ONLY" -eq 1 ]; then
            printf '%s\n' 'Missing Node.js or Python 3. Run this script without --check to install them.' >&2
            exit 1
        fi

        if [ "$(uname -s)" != Darwin ]; then
            printf '%s\n' 'Install Node.js 20+ and Python 3, then rerun this script.' >&2
            exit 1
        fi
        if ! command -v brew >/dev/null 2>&1; then
            printf '%s\n' 'Homebrew is required to install missing Node.js or Python 3 on macOS.' >&2
            exit 1
        fi

        local packages=()
        command -v node >/dev/null 2>&1 || packages+=(node)
        command -v python3 >/dev/null 2>&1 || packages+=(python)
        brew install "${packages[@]}"
    fi

    if ! command -v npm >/dev/null 2>&1; then
        printf '%s\n' 'npm was not found. Install Node.js 20+ (which includes npm), then rerun this script.' >&2
        exit 1
    fi

    local node_major
    node_major=$(node -p 'Number(process.versions.node.split(".")[0])')
    if [ "$node_major" -lt 20 ]; then
        printf 'Node.js 20+ is required; found %s. Upgrade Node.js and rerun this script.\n' "$(node --version)" >&2
        exit 1
    fi

    printf 'Node.js %s, npm %s, and Python %s are available.\n' \
        "$(node --version)" "$(npm --version)" "$(python3 --version | awk '{print $2}')"
}

require_tools

if [ "$CHECK_ONLY" -eq 1 ]; then
    exit 0
fi

printf '%s\n' 'Installing Playwright and its Chromium browser into the local npm/Playwright caches...'
if ! npm exec --yes --package=playwright@latest -- playwright install chromium; then
    printf '%s\n' \
        'Playwright setup failed. Check the npm output and your network or proxy certificate configuration.' \
        'This script does not disable TLS verification; use your organization-provided trusted CA if required.' >&2
    exit 1
fi

printf '%s\n' 'Browser test tools are ready.'
