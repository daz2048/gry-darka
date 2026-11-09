#!/usr/bin/env python3
"""Manage the repository's local game server with macOS launchd."""

import argparse
from contextlib import redirect_stderr, redirect_stdout
from functools import partial
import hashlib
import http.client
import http.server
import os
from pathlib import Path
import plistlib
import re
import socket
import subprocess
import sys
import threading
import time
import traceback


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
LOG_SIZE = 1024 * 1024
LOG_BACKUPS = 3


def prepare_logs():
    STATE_DIR.mkdir(parents=True, exist_ok=True, mode=0o700)
    STATE_DIR.chmod(0o700)
    descriptor = os.open(LOG, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
    try:
        os.fchmod(descriptor, 0o600)
    finally:
        os.close(descriptor)
    for number in range(1, LOG_BACKUPS + 1):
        backup = LOG.with_name(f"{LOG.name}.{number}")
        if backup.exists():
            backup.chmod(0o600)


class RotatingLog:
    def __init__(self, path, max_bytes=LOG_SIZE, backups=LOG_BACKUPS):
        self.path = path
        self.max_bytes = max_bytes
        self.backups = backups
        self.lock = threading.Lock()
        self.file = self.open_file()

    def open_file(self):
        descriptor = os.open(self.path, os.O_WRONLY | os.O_CREAT | os.O_APPEND, 0o600)
        try:
            os.fchmod(descriptor, 0o600)
            return os.fdopen(descriptor, "ab")
        except BaseException:
            os.close(descriptor)
            raise

    def rotate(self):
        self.file.close()
        for number in range(self.backups, 0, -1):
            source = self.path if number == 1 else self.path.with_name(
                f"{self.path.name}.{number - 1}"
            )
            target = self.path.with_name(f"{self.path.name}.{number}")
            if source.exists():
                os.replace(source, target)
        self.file = self.open_file()

    def write(self, text):
        data = text.encode("utf-8", errors="backslashreplace")
        with self.lock:
            while data:
                available = self.max_bytes - os.fstat(self.file.fileno()).st_size
                if available <= 0 or (len(data) <= self.max_bytes and len(data) > available):
                    self.rotate()
                    available = self.max_bytes
                end = min(available, len(data))
                while end < len(data) and data[end] & 0xC0 == 0x80:
                    end -= 1
                if not end:
                    if available == self.max_bytes:
                        raise ValueError("Log size is too small for a UTF-8 character")
                    self.rotate()
                    continue
                chunk, data = data[:end], data[end:]
                self.file.write(chunk)
                self.file.flush()
        return len(text)

    def flush(self):
        with self.lock:
            self.file.flush()

    def close(self):
        with self.lock:
            self.file.close()


def serve():
    prepare_logs()
    log = RotatingLog(LOG)
    with redirect_stdout(log), redirect_stderr(log):
        try:
            handler = partial(http.server.SimpleHTTPRequestHandler, directory=str(ROOT))
            with http.server.ThreadingHTTPServer((HOST, PORT), handler) as server:
                print(f"Serving HTTP on {HOST} port {PORT} ({URL}) ...", flush=True)
                server.serve_forever()
        except Exception:
            traceback.print_exc()
            raise SystemExit(1) from None
        finally:
            log.close()


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

    prepare_logs()
    config = {
        "Label": LABEL,
        "ProgramArguments": [
            sys.executable, "-u", str(Path(__file__).resolve()), "--serve",
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
    if sys.argv[1:] == ["--serve"]:
        serve()
        return
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
