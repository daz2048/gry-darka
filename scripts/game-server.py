#!/usr/bin/env python3
"""Manage the repository's local game server with macOS launchd."""

import argparse
import hashlib
import http.client
import os
from pathlib import Path
import plistlib
import re
import socket
import subprocess
import sys
import time


ROOT = Path(__file__).resolve().parent.parent
PORT = 8765
HOST = "127.0.0.1"
URL = f"http://localhost:{PORT}/"
LABEL = "io.github.gry-darka.server." + hashlib.sha256(
    str(ROOT).encode()
).hexdigest()[:16]
DOMAIN = f"gui/{os.getuid()}"
SERVICE = f"{DOMAIN}/{LABEL}"
STATE_DIR = Path.home() / "Library" / "Application Support" / "gry-darka"
PLIST = STATE_DIR / f"{LABEL}.plist"
LOG = STATE_DIR / f"{LABEL}.log"


def launchctl(*args, check=True):
    return subprocess.run(
        ["/bin/launchctl", *args],
        capture_output=True,
        text=True,
        check=check,
    )


def service_pid():
    result = launchctl("print", SERVICE, check=False)
    if result.returncode:
        domain = launchctl("print", DOMAIN, check=False)
        if domain.returncode:
            raise RuntimeError(f"launchd user domain is unavailable: {domain.stderr.strip()}")
        return None
    match = re.search(r"^\s*pid = (\d+)\s*$", result.stdout, re.MULTILINE)
    return int(match.group(1)) if match else None


def service_loaded():
    result = launchctl("print", SERVICE, check=False)
    if result.returncode:
        domain = launchctl("print", DOMAIN, check=False)
        if domain.returncode:
            raise RuntimeError(f"launchd user domain is unavailable: {domain.stderr.strip()}")
        return False
    return True


def is_ready():
    pid = service_pid()
    if pid is None:
        return False
    listener = subprocess.run(
        ["/usr/sbin/lsof", "-nP", "-a", "-p", str(pid),
         f"-iTCP:{PORT}", "-sTCP:LISTEN"],
        capture_output=True,
        text=True,
    )
    if listener.returncode:
        return False
    try:
        connection = http.client.HTTPConnection(HOST, PORT, timeout=1)
        try:
            connection.request("GET", "/")
            response = connection.getresponse()
            return response.status == 200 and b"Gry Ekipy" in response.read()
        finally:
            connection.close()
    except (OSError, http.client.HTTPException):
        return False


def start():
    if service_loaded():
        if is_ready():
            print(f"Game server is already running at {URL}")
            return
        raise RuntimeError(f"Game server is loaded but not responding. Check {LOG} or run restart.")

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as probe:
        probe.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        try:
            probe.bind((HOST, PORT))
        except OSError as error:
            raise RuntimeError(f"Cannot use {HOST}:{PORT}: {error}. Another service may be using it.") from error

    STATE_DIR.mkdir(parents=True, exist_ok=True)
    config = {
        "Label": LABEL,
        "ProgramArguments": [
            sys.executable, "-u", "-m", "http.server", str(PORT),
            "--bind", HOST, "--directory", str(ROOT),
        ],
        "RunAtLoad": True,
        "KeepAlive": True,
        "StandardOutPath": str(LOG),
        "StandardErrorPath": str(LOG),
    }
    with PLIST.open("wb") as file:
        plistlib.dump(config, file)
    launchctl("bootstrap", DOMAIN, str(PLIST))

    deadline = time.monotonic() + 10
    while time.monotonic() < deadline:
        if is_ready():
            print(f"Game server is running at {URL}")
            return
        time.sleep(0.1)
    launchctl("bootout", SERVICE)
    raise RuntimeError(f"Game server failed to start. Check {LOG}.")


def stop():
    if not service_loaded():
        print("Game server is not running.")
        return
    launchctl("bootout", SERVICE)
    print("Game server stopped.")


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("action", nargs="?", choices=("start", "restart", "stop", "status"),
                        default="start")
    args = parser.parse_args()
    if sys.platform != "darwin":
        parser.exit(1, "Error: this helper requires macOS and a logged-in launchd GUI session.\n")
    try:
        if args.action == "start":
            start()
        elif args.action == "restart":
            stop()
            start()
        elif args.action == "stop":
            stop()
        elif is_ready():
            print(f"Game server is running at {URL}")
        else:
            parser.exit(1, f"Game server is not running or not responding. Check {LOG} if needed.\n")
    except (OSError, RuntimeError, subprocess.CalledProcessError) as error:
        detail = error.stderr.strip() if isinstance(error, subprocess.CalledProcessError) else str(error)
        parser.exit(1, f"Error: {detail}\n")


if __name__ == "__main__":
    main()
