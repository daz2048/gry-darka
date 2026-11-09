#!/bin/bash

set -euo pipefail

ROOT=$(cd "$(dirname "$0")/.." && pwd -P)
SERVER="$ROOT/scripts/game-server.py"
LABEL="io.github.gry-darka.server.$(printf '%s' "$ROOT" | shasum -a 256 | cut -c1-16)"
LOG="$HOME/Library/Application Support/gry-darka/$LABEL.log"
ACTION=start

case "${1:-}" in
    "") ;;
    -r|--restart) ACTION=restart ;;
    -h|--help)
        printf 'Usage: %s [--restart|-r]\n' "$0"
        exit 0
        ;;
    *) printf 'Usage: %s [--restart|-r]\n' "$0" >&2; exit 2 ;;
esac
if [ "$#" -gt 1 ]; then
    printf 'Usage: %s [--restart|-r]\n' "$0" >&2
    exit 2
fi

if [ "$ACTION" = restart ]; then
    python3 "$SERVER" stop
    for pid in $(lsof -nP -t -iTCP:8765 -sTCP:LISTEN || true); do
        command_line=$(ps -p "$pid" -o command= || true)
        owner=$(ps -p "$pid" -o uid= | tr -d ' ' || true)
        case "$command_line" in
            *"-m http.server 8765"*"--directory $ROOT")
                if [ "$owner" != "$(id -u)" ]; then
                    printf 'Cannot stop server PID %s owned by another user.\n' "$pid" >&2
                    exit 1
                fi
                printf 'Stopping matching server PID %s.\n' "$pid"
                kill "$pid"
                ;;
            *)
                printf 'Port 8765 is occupied by an unrelated process (PID %s); not stopping it.\n' "$pid" >&2
                exit 1
                ;;
        esac
    done
fi

python3 "$SERVER" start
pid=$(launchctl print "gui/$(id -u)/$LABEL" | awk '$1 == "pid" && $2 == "=" { print $3; exit }')
printf 'Server PID: %s\nLog: %s\n' "${pid:-unavailable}" "$LOG"
printf 'Recent requests:\n'
tail -n 10 "$LOG"
printf 'Live requests (Ctrl+C detaches; the server keeps running):\n'
printf 'Requests since attachment: 0 | HTTP errors: 0\n'

tail -n 0 -F "$LOG" | awk '
    {
        print
        if (match($0, /" [0-9][0-9][0-9] /)) {
            requests++
            if (substr($0, RSTART + 2, 3) >= 400) errors++
            printf "Requests since attachment: %d | HTTP errors: %d\n", requests, errors
        }
        fflush()
    }
'