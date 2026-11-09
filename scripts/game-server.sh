#!/bin/bash

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
SERVER="$ROOT/scripts/game-server.py"
LABEL="io.github.gry-darka.server.$(printf '%s' "$ROOT" | shasum -a 256 | cut -c1-16)"
LOG="$HOME/Library/Application Support/gry-darka/$LABEL.log"
ACTION=start

RESET='' BOLD='' CYAN='' GREEN='' YELLOW='' RED='' DIM=''
if [ -t 1 ] && [ -n "${TERM:-}" ] && [ "$TERM" != dumb ] && [ -z "${NO_COLOR:-}" ]; then
    RESET=$'\033[0m' BOLD=$'\033[1m' CYAN=$'\033[36m' GREEN=$'\033[32m'
    YELLOW=$'\033[33m' RED=$'\033[31m' DIM=$'\033[2m'
fi

heading() {
    printf '\n%s%s[ %s ]%s\n' "$BOLD" "$CYAN" "$1" "$RESET"
}

controls() {
    printf '%s\n' \
        'Commands (single key, no Enter needed):' \
        '  r restart | s status | q quit monitor (server stays running)' \
        '  x stop server and quit | h/? help'
}

help() {
    heading 'GAME SERVER // HELP'
    printf '%s\n' \
        'Start or attach to the local game server and follow its request log.' \
        '' \
        "Usage: $0 [OPTION]" \
        '' \
        'Options:' \
        '  r, -r, --restart   Restart the server before attaching.' \
        '  s, status          Show server status and exit.' \
        '  q, quit            Exit without changing the server.' \
        '  x, stop            Stop the server and exit.' \
        '  h, ?, -h, --help    Show this help and exit.' \
        '' \
        'Examples:' \
        "  $0                 Start or attach to the server" \
        "  $0 --restart       Restart and attach" \
        "  python3 \"$SERVER\" status   Check server status" \
        "  python3 \"$SERVER\" stop     Stop the server" \
        '' \
        'Server:' \
        '  URL:        http://localhost:8765/' \
        "  Root:       $ROOT" \
        "  Log:        $LOG" \
        '  Platform:   macOS, Python 3, and a logged-in launchd GUI session' \
        '' \
        'Monitor:' \
        '  Shows the last 10 log lines, then live requests and HTTP error counts.' \
        '  Counters cover requests observed since attaching, not the recent history.' \
        '  HTTP status colors: 2xx green, 3xx cyan, 4xx yellow, 5xx red.' \
        '  Set NO_COLOR to disable colors. Piped output is always plain text.' \
        '  Ctrl+C or closing the terminal detaches; the server keeps running.' \
        '' \
        'Restart stops the managed server and matching local server listeners.' \
        'Unrelated processes on port 8765 are not stopped.'
    printf '\n'
    controls
}

format_log() {
    awk -v count="$1" -v reset="$RESET" -v green="$GREEN" -v cyan="$CYAN" \
        -v yellow="$YELLOW" -v red="$RED" -v dim="$DIM" '
        {
            color = dim
            if (match($0, /" [0-9][0-9][0-9] /)) {
                status = substr($0, RSTART + 2, 3) + 0
                if (status >= 500) color = red
                else if (status >= 400) color = yellow
                else if (status >= 300) color = cyan
                else if (status >= 200) color = green
                if (count) {
                    requests++
                    if (status >= 400) errors++
                }
            }
            printf "%s%s%s\n", color, $0, reset
            if (count && status) {
                printf "%s[ STATS ]%s Requests: %d | HTTP errors: %d\n", cyan, reset, requests, errors
            }
            status = 0
            fflush()
        }
    '
}

restart_server() {
    heading 'SERVER // RESTART'
    python3 "$SERVER" stop || return
    for pid in $(lsof -nP -t -iTCP:8765 -sTCP:LISTEN || true); do
        command_line=$(ps -p "$pid" -o command= || true)
        owner=$(ps -p "$pid" -o uid= | tr -d ' ' || true)
        case "$command_line" in
            *"-m http.server 8765"*"--directory $ROOT")
                if [ "$owner" != "$(id -u)" ]; then
                    printf 'Cannot stop server PID %s owned by another user.\n' "$pid" >&2
                    return 1
                fi
                printf 'Stopping matching server PID %s.\n' "$pid"
                kill "$pid" || return
                ;;
            *)
                printf 'Port 8765 is occupied by an unrelated process (PID %s); not stopping it.\n' "$pid" >&2
                return 1
                ;;
        esac
    done
    python3 "$SERVER" start
}

if [ "$#" -gt 1 ]; then
    printf 'Usage: %s [r|s|q|x|h|--restart|--help]\n' "$0" >&2
    exit 2
fi

case "${1:-}" in
    "") ;;
    r|-r|--restart) ACTION=restart ;;
    s|status) ACTION=status ;;
    q|quit) exit 0 ;;
    x|stop) ACTION=stop ;;
    h|help|-h|--help|\?)
        help
        exit 0
        ;;
    *) printf 'Unknown command: %s. Use --help for commands.\n' "$1" >&2; exit 2 ;;
esac

heading 'GAME SERVER // CONTROL'
case "$ACTION" in
    restart) restart_server ;;
    status|stop) python3 "$SERVER" "$ACTION"; exit ;;
    start) python3 "$SERVER" start ;;
esac
pid=$(launchctl print "gui/$(id -u)/$LABEL" | awk '$1 == "pid" && $2 == "=" { print $3; exit }')
printf 'URL:        %shttp://localhost:8765/%s\n' "$GREEN" "$RESET"
printf 'Server PID: %s\nRoot:       %s\nLog:        %s\n' "${pid:-unavailable}" "$ROOT" "$LOG"
heading 'LOG // RECENT'
tail -n 10 "$LOG" | format_log 0
heading 'LOG // LIVE'
printf '%sCtrl+C detaches; the server keeps running.%s\n' "$DIM" "$RESET"
printf '%s[ STATS ]%s Requests: 0 | HTTP errors: 0\n' "$CYAN" "$RESET"

if [ ! -t 0 ]; then
    tail -n 0 -F "$LOG" | format_log 1
    exit
fi

monitor_dir=$(mktemp -d)
mkfifo "$monitor_dir/log"
exec 3<> "$monitor_dir/log"
tail -n 0 -F "$LOG" > "$monitor_dir/log" 3>&- &
tail_pid=$!
format_log 1 < "$monitor_dir/log" 3>&- &
format_pid=$!

cleanup() {
    kill "$tail_pid" 2>/dev/null || true
    wait "$tail_pid" 2>/dev/null || true
    exec 3>&-
    wait "$format_pid" || true
    rm "$monitor_dir/log"
    rmdir "$monitor_dir"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM
trap 'exit 129' HUP

controls
while IFS= read -r -s -n 1 command; do
    case "$command" in
        r|R)
            if ! restart_server; then
                printf 'Restart failed. Use s for status or r to retry.\n' >&2
            fi
            ;;
        s|S)
            heading 'SERVER // STATUS'
            if ! python3 "$SERVER" status; then
                printf 'Status check failed. Use r to restart the server.\n' >&2
            fi
            ;;
        q|Q)
            printf '\nDetached; the server keeps running.\n'
            break
            ;;
        x|X)
            if python3 "$SERVER" stop; then
                break
            fi
            printf 'Stop failed. The monitor is still attached.\n' >&2
            ;;
        h|H|\?) controls ;;
        ''|$'\r') ;;
        *) printf '\nUnknown command: %s. Press h for help.\n' "$command" >&2 ;;
    esac
done