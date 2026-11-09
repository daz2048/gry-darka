#!/bin/bash

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
SERVER="$ROOT/scripts/game-server.py"
LABEL="io.github.gry-darka.server.$(printf '%s' "$ROOT" | shasum -a 256 | cut -c1-16)"
LOG="$HOME/Library/Application Support/gry-darka/$LABEL.log"
ACTION=start
DEBUG=0
ACTION_SET=0

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
        '  x stop server and quit | d toggle debug | h/? help'
    if [ "$DEBUG" -eq 1 ]; then
        printf 'Debug mode: enabled\n'
    else
        printf 'Debug mode: disabled\n'
    fi
}

debug() {
    if [ "$DEBUG" -eq 1 ]; then
        printf '%s[ DEBUG ]%s %s\n' "$DIM" "$RESET" "$*" >&2
    fi
}

help() {
    heading 'GAME SERVER // HELP'
    printf '%s\n' \
        'Start or attach to the local game server and follow its request log.' \
        '' \
        "Usage: $0 [OPTION]..." \
        '' \
        'Options:' \
        '  -d, --debug        Show wrapper diagnostics.' \
        '  r, -r, --restart   Restart the server before attaching.' \
        '  s, status          Show server status and exit.' \
        '  q, quit            Exit without changing the server.' \
        '  x, stop            Stop the server and exit.' \
        '  h, ?, -h, --help    Show this help and exit.' \
        '' \
        'Examples:' \
        "  $0                 Start or attach to the server" \
        "  $0 --debug         Start or attach with wrapper diagnostics" \
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
    debug 'Stopping the managed server.'
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
    debug 'Starting the managed server.'
    python3 "$SERVER" start
}

while [ "$#" -gt 0 ]; do
    case "$1" in
        -d|--debug) DEBUG=1 ;;
        r|-r|--restart|s|status|q|quit|x|stop)
            if [ "$ACTION_SET" -eq 1 ]; then
                printf 'Only one action may be specified. Use --help for commands.\n' >&2
                exit 2
            fi
            ACTION_SET=1
            case "$1" in
                r|-r|--restart) ACTION=restart ;;
                s|status) ACTION=status ;;
                q|quit) ACTION=quit ;;
                x|stop) ACTION=stop ;;
            esac
            ;;
        h|help|-h|--help|\?)
            help
            exit 0
            ;;
        *) printf 'Unknown command: %s. Use --help for commands.\n' "$1" >&2; exit 2 ;;
    esac
    shift
done

if [ "$ACTION" = quit ]; then
    exit 0
fi

debug "Debug mode enabled. Requested action: $ACTION"
heading 'GAME SERVER // CONTROL'
case "$ACTION" in
    restart) restart_server ;;
    status|stop) python3 "$SERVER" "$ACTION"; exit ;;
    start)
        debug 'Starting or attaching to the server.'
        python3 "$SERVER" start
        ;;
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
    debug 'Following the log in non-interactive mode.'
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

debug 'Starting the interactive live log monitor.'
controls
while IFS= read -r -s -n 1 command; do
    case "$command" in
        r|R)
            debug 'Restart command received.'
            if ! restart_server; then
                printf 'Restart failed. Use s for status or r to retry.\n' >&2
            fi
            ;;
        s|S)
            debug 'Status command received.'
            heading 'SERVER // STATUS'
            if ! python3 "$SERVER" status; then
                printf 'Status check failed. Use r to restart the server.\n' >&2
            fi
            ;;
        q|Q)
            debug 'Detach command received.'
            printf '\nDetached; the server keeps running.\n'
            break
            ;;
        x|X)
            debug 'Stop command received.'
            if python3 "$SERVER" stop; then
                break
            fi
            printf 'Stop failed. The monitor is still attached.\n' >&2
            ;;
        d|D)
            if [ "$DEBUG" -eq 1 ]; then
                DEBUG=0
                printf '\nDebug mode disabled.\n'
            else
                DEBUG=1
                printf '\nDebug mode enabled.\n'
                debug 'Interactive debug mode enabled.'
            fi
            controls
            ;;
        h|H|\?) controls ;;
        ''|$'\r') ;;
        *) printf '\nUnknown command: %s. Press h for help.\n' "$command" >&2 ;;
    esac
done