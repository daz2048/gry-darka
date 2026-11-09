import http.client
import importlib.util
import os
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
