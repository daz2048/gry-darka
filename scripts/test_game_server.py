import http.client
import importlib.util
import json
import os
from functools import partial
from pathlib import Path
import select
import socket
import stat
import subprocess
import sys
import tempfile
import threading
import time
import unittest
from unittest import mock


SCRIPT = Path(__file__).with_name("game-server.py")
spec = importlib.util.spec_from_file_location("game_server", SCRIPT)
game_server = importlib.util.module_from_spec(spec)
spec.loader.exec_module(game_server)


class DiagnosticsTests(unittest.TestCase):
    def setUp(self):
        temporary = tempfile.TemporaryDirectory()
        self.addCleanup(temporary.cleanup)
        self.root = Path(temporary.name)
        (self.root / "index.html").write_text("test page")
        self.log = self.root / "server.log"
        self.log.write_text("server started\n")
        patcher = mock.patch.object(game_server, "LOG", self.log)
        patcher.start()
        self.addCleanup(patcher.stop)
        self.metadata = {
            "branch": "test-branch", "clean": True, "commit": "a" * 40,
            "committedAt": "2026-11-13T09:00:00Z",
        }
        patcher = mock.patch.object(game_server, "git_metadata", return_value=self.metadata)
        self.git = patcher.start()
        self.addCleanup(patcher.stop)
        patcher = mock.patch.object(game_server.GameRequestHandler, "log_message")
        patcher.start()
        self.addCleanup(patcher.stop)
        handler = partial(game_server.GameRequestHandler, directory=str(self.root))
        self.server = game_server.GameHTTPServer(("127.0.0.1", 0), handler)
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.01})
        self.thread.start()

    def tearDown(self):
        self.server.shutdown()
        self.thread.join(timeout=3)
        self.server.server_close()

    def request(self, path, headers=None):
        connection = http.client.HTTPConnection("127.0.0.1", self.server.server_port, timeout=3)
        try:
            connection.request("GET", path, headers=headers or {})
            response = connection.getresponse()
            return response.status, dict(response.getheaders()), response.read()
        finally:
            connection.close()

    def test_metadata_and_health_count_requests_and_http_errors(self):
        self.assertEqual(self.request("/")[0], 200)
        self.assertEqual(self.request("/missing")[0], 404)
        status, headers, body = self.request("/__diagnostics/status")
        data = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertNotIn("Access-Control-Allow-Origin", headers)
        self.assertEqual(data["git"], self.metadata)
        self.assertEqual(data["server"]["requests"], 2)
        self.assertEqual(data["server"]["httpErrors"], 1)
        self.assertEqual(data["server"]["serverErrors"], 0)
        self.assertEqual(data["server"]["lastError"], "HTTP 404")

    def test_server_exception_is_recorded(self):
        with mock.patch.object(game_server.http.server.ThreadingHTTPServer, "handle_error"):
            try:
                raise RuntimeError("test handler failure")
            except RuntimeError:
                self.server.handle_error(None, ("127.0.0.1", 0))
        data = json.loads(self.request("/__diagnostics/status")[2])
        self.assertEqual(data["server"]["serverErrors"], 1)
        self.assertEqual(data["server"]["lastError"], "test handler failure")

    def test_git_failure_keeps_server_health_available(self):
        self.git.side_effect = subprocess.TimeoutExpired("git", 3)
        with mock.patch.object(game_server.sys, "stderr"):
            data = json.loads(self.request("/__diagnostics/status")[2])
        self.assertIsNone(data["git"])
        self.assertIn("Git metadata unavailable", data["gitError"])
        self.assertEqual(data["server"]["serverErrors"], 0)

    def test_diagnostics_reject_foreign_hosts_and_cross_origin_requests(self):
        for path in ("/__diagnostics/status", "/__diagnostics/logs"):
            for headers in (
                {"Host": "foreign.example"},
                {"Origin": "https://foreign.example"},
                {"Origin": "null"},
                {"Sec-Fetch-Site": "cross-site"},
            ):
                with self.subTest(path=path, headers=headers):
                    self.assertEqual(self.request(path, headers)[0], 403)
        origin = f"http://127.0.0.1:{self.server.server_port}"
        self.assertEqual(self.request("/__diagnostics/status", {"Origin": origin})[0], 200)

    def test_recent_logs_are_bounded_and_missing_logs_are_explicit(self):
        self.log.write_text("".join(f"{number}: {'x' * 700}\n" for number in range(400)))
        status, headers, body = self.request("/__diagnostics/logs")
        data = json.loads(body)
        self.assertEqual(status, 200)
        self.assertEqual(headers["Cache-Control"], "no-store")
        self.assertLessEqual(len(data["text"].encode()), game_server.LOG_TAIL_BYTES)
        self.assertLessEqual(len(data["text"].splitlines()), game_server.LOG_TAIL_LINES)
        self.assertIn("399: ", data["text"])
        self.assertTrue(data["truncated"])
        self.log.write_text("".join(f"line {number}\n" for number in range(220)))
        data = json.loads(self.request("/__diagnostics/logs")[2])
        self.assertEqual(len(data["text"].splitlines()), 200)
        self.assertTrue(data["text"].startswith("line 20\n"))
        self.log.write_text("x" * (game_server.LOG_TAIL_BYTES * 2) + "last error\n")
        data = json.loads(self.request("/__diagnostics/logs")[2])
        self.assertTrue(data["text"].endswith("last error\n"))
        self.assertEqual(len(data["text"].encode()), game_server.LOG_TAIL_BYTES)
        self.assertTrue(data["truncated"])
        self.log.write_text("ą" * game_server.LOG_TAIL_BYTES + "last error\n")
        data = json.loads(self.request("/__diagnostics/logs")[2])
        self.assertNotIn("\ufffd", data["text"])
        self.assertTrue(data["text"].endswith("last error\n"))
        self.assertLessEqual(len(data["text"].encode()), game_server.LOG_TAIL_BYTES)
        self.log.write_text("one line\n")
        data = json.loads(self.request("/__diagnostics/logs")[2])
        self.assertEqual(data, {"text": "one line\n", "truncated": False})
        self.log.unlink()
        status, _, body = self.request("/__diagnostics/logs")
        self.assertEqual(status, 503)
        self.assertIn("Cannot read", json.loads(body)["error"])


class GitMetadataTests(unittest.TestCase):
    def test_git_metadata_detects_clean_dirty_and_detached_head(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            def git(*args):
                return subprocess.run(
                    ["git", "-C", directory, *args], check=True,
                    capture_output=True, text=True,
                ).stdout.strip()
            git("init", "-b", "diagnostics-test")
            (root / "game.js").write_text("initial")
            git("add", "game.js")
            git("-c", "user.name=Test", "-c", "user.email=test@example.invalid",
                "commit", "-m", "Test fixture\n\nCo-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>")
            with mock.patch.object(game_server, "ROOT", root):
                clean = game_server.git_metadata()
                self.assertEqual(clean["branch"], "diagnostics-test")
                self.assertTrue(clean["clean"])
                self.assertEqual(clean["commit"], git("rev-parse", "HEAD"))
                self.assertTrue(clean["committedAt"])
                (root / "game.js").write_text("modified")
                self.assertFalse(game_server.git_metadata()["clean"])
                git("checkout", "--detach")
                self.assertEqual(game_server.git_metadata()["branch"], "HEAD")


class LogTests(unittest.TestCase):
    def test_rotation_retains_three_one_mib_backups(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "server.log"
            log = game_server.RotatingLog(path)
            for letter in "abcde":
                log.write(letter * game_server.LOG_SIZE)
            log.close()

            self.assertEqual(path.read_bytes(), b"e" * game_server.LOG_SIZE)
            for number, letter in enumerate("dcb", 1):
                backup = path.with_name(f"{path.name}.{number}")
                self.assertEqual(backup.read_bytes(), letter.encode() * game_server.LOG_SIZE)
                self.assertEqual(stat.S_IMODE(backup.stat().st_mode), 0o600)
            self.assertFalse(path.with_name("server.log.4").exists())
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)

    def test_concurrent_writes_are_not_lost(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "server.log"
            log = game_server.RotatingLog(path, max_bytes=1000, backups=3)
            threads = [
                threading.Thread(target=lambda: [log.write("x" * 10) for _ in range(100)])
                for _ in range(4)
            ]
            for thread in threads:
                thread.start()
            for thread in threads:
                thread.join()
            log.close()
            files = [path] + [path.with_name(f"{path.name}.{n}") for n in range(1, 4)]
            self.assertEqual(sum(file.stat().st_size for file in files), 4000)

    def test_rollover_keeps_normal_writes_and_utf8_characters_together(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "server.log"
            log = game_server.RotatingLog(path, max_bytes=4, backups=3)
            log.write("abc")
            log.write("é")
            log.write("😃😃")
            log.close()
            self.assertEqual(path.read_text(), "😃")
            self.assertEqual(path.with_name("server.log.1").read_text(), "😃")
            self.assertEqual(path.with_name("server.log.2").read_text(), "é")
            self.assertEqual(path.with_name("server.log.3").read_text(), "abc")

    def test_tail_f_follows_rotated_log(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "server.log"
            log = game_server.RotatingLog(path, max_bytes=1024, backups=3)
            log.write("a" * 1024)
            tail = subprocess.Popen(
                ["tail", "-n", "0", "-F", str(path)],
                stdout=subprocess.PIPE, stderr=subprocess.PIPE,
            )
            try:
                time.sleep(0.5)
                self.assertIsNone(tail.poll())
                log.write("after rotation\n")
                ready, _, _ = select.select([tail.stdout], [], [], 15)
                self.assertTrue(ready, "tail -F did not follow the rotated log")
                self.assertIn(b"after rotation", os.read(tail.stdout.fileno(), 1024))
            finally:
                tail.terminate()
                tail.communicate(timeout=5)
                log.close()

    def test_existing_logs_are_made_private(self):
        with tempfile.TemporaryDirectory() as directory:
            state = Path(directory) / "state"
            state.mkdir(mode=0o755)
            path = state / "server.log"
            backup = state / "server.log.1"
            path.write_text("existing")
            backup.write_text("older")
            os.chmod(path, 0o644)
            os.chmod(backup, 0o644)
            with mock.patch.object(game_server, "STATE_DIR", state), \
                    mock.patch.object(game_server, "LOG", path):
                game_server.prepare_logs()
            self.assertEqual(stat.S_IMODE(state.stat().st_mode), 0o700)
            self.assertEqual(stat.S_IMODE(path.stat().st_mode), 0o600)
            self.assertEqual(stat.S_IMODE(backup.stat().st_mode), 0o600)
            self.assertEqual(path.read_text(), "existing")

    def test_server_serves_files_and_logs_requests(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "index.html").write_text("test page")
            state = root / "state"
            log = state / "server.log"
            with socket.socket() as sock:
                sock.bind(("127.0.0.1", 0))
                port = sock.getsockname()[1]
            code = (
                "import importlib.util, pathlib\n"
                f"spec = importlib.util.spec_from_file_location('server', {str(SCRIPT)!r})\n"
                "server = importlib.util.module_from_spec(spec)\n"
                "spec.loader.exec_module(server)\n"
                f"server.ROOT = pathlib.Path({str(root)!r})\n"
                f"server.STATE_DIR = pathlib.Path({str(state)!r})\n"
                f"server.LOG = pathlib.Path({str(log)!r})\n"
                f"server.PORT = {port}\n"
                "server.serve()\n"
            )
            process = subprocess.Popen([sys.executable, "-c", code])
            try:
                deadline = time.monotonic() + 5
                while True:
                    try:
                        connection = http.client.HTTPConnection("127.0.0.1", port, timeout=1)
                        connection.request("GET", "/")
                        response = connection.getresponse()
                        self.assertEqual(response.status, 200)
                        self.assertEqual(response.read(), b"test page")
                        connection.request("GET", "/missing")
                        response = connection.getresponse()
                        self.assertEqual(response.status, 404)
                        response.read()
                        connection.close()
                        break
                    except ConnectionRefusedError:
                        if process.poll() is not None or time.monotonic() >= deadline:
                            self.fail("Server failed to start")
                        time.sleep(0.05)
                contents = log.read_text()
                self.assertIn('"GET / HTTP/1.1" 200', contents)
                self.assertIn('"GET /missing HTTP/1.1" 404', contents)
            finally:
                process.terminate()
                process.wait(timeout=5)


if __name__ == "__main__":
    unittest.main()
