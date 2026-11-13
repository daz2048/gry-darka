import importlib.util
import io
import json
import os
import re
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest import mock


spec = importlib.util.spec_from_file_location(
    "music_catalogue", Path(__file__).with_name("generate-music-catalogue.py")
)
catalogue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalogue)


class MusicCatalogueTest(unittest.TestCase):
    def test_scans_and_refreshes_supported_audio_files(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "Żółty song.MP3").touch()
            (folder / "a.mp3").touch()
            (folder / "b.WAV").touch()
            (folder / "c.ogg").touch()
            (folder / "d.m4a").touch()
            (folder / "notes.txt").touch()
            (folder / "folder.mp3").mkdir()
            self.assertEqual(catalogue.generate(folder), 5)
            result = json.loads((folder / "catalogue.json").read_text(encoding="utf-8"))
            self.assertEqual(result, [
                {"file": "a.mp3", "title": "a"},
                {"file": "b.WAV", "title": "b"},
                {"file": "c.ogg", "title": "c"},
                {"file": "d.m4a", "title": "d"},
                {"file": "Żółty song.MP3", "title": "Żółty song"},
            ])
            (folder / "a.mp3").unlink()
            (folder / "b.WAV").unlink()
            (folder / "c.ogg").unlink()
            (folder / "d.m4a").unlink()
            (folder / "Żółty song.MP3").unlink()
            self.assertEqual(catalogue.generate(folder), 0)
            self.assertEqual(json.loads((folder / "catalogue.json").read_text()), [])

    def test_invalid_filenames_do_not_replace_the_catalogue(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "catalogue.json").write_text("existing", encoding="utf-8")
            (folder / "   .wav").touch()
            with self.assertRaisesRegex(ValueError, "Unsupported audio filename"):
                catalogue.generate(folder)
            self.assertEqual((folder / "catalogue.json").read_text(), "existing")

    def test_wrapper_reports_created_updated_and_unchanged(self):
        wrapper = Path(__file__).with_name("generate-music-catalogue.sh")
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "a.MP3").write_bytes(b"abc")
            (folder / "b.wav").write_bytes(b"12345")

            def run():
                return subprocess.run(
                    [str(wrapper), str(folder)], capture_output=True, text=True, check=True
                ).stdout

            created = run()
            self.assertIn("Music catalogue wrapper v1.0 | branch:", created)
            self.assertIn("(created)", created)
            self.assertIn("Track changes: +2 / -0", created)
            self.assertIn("2 track(s) | 8 audio bytes | formats: mp3: 1, wav: 1", created)
            self.assertIn("Next: review", created)

            (folder / "a.MP3").unlink()
            (folder / "c.ogg").touch()
            updated = run()
            self.assertIn("(updated)", updated)
            self.assertIn("Track changes: +1 / -1", updated)
            unchanged = run()
            self.assertIn("(unchanged)", unchanged)
            self.assertIn("Track changes: +0 / -0", unchanged)

    def test_wrapper_reports_invalid_previous_catalogue_and_generation_errors(self):
        wrapper = Path(__file__).with_name("generate-music-catalogue.sh")
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            destination = folder / "catalogue.json"
            destination.write_text("invalid", encoding="utf-8")
            result = subprocess.run([str(wrapper), str(folder)], capture_output=True, text=True)
            self.assertEqual(result.returncode, 0)
            self.assertIn("previous catalogue was invalid", result.stdout)
            self.assertIn("0 track(s) | 0 audio bytes | formats: none", result.stdout)

            (folder / "   .wav").touch()
            result = subprocess.run([str(wrapper), str(folder)], capture_output=True, text=True)
            self.assertNotEqual(result.returncode, 0)
            self.assertIn("Unsupported audio filename", result.stderr)
            self.assertNotIn("Next:", result.stdout)
            self.assertEqual(json.loads(destination.read_text()), [])

    def test_wrapper_colors_terminal_output_and_honors_no_color(self):
        class Terminal(io.StringIO):
            def isatty(self):
                return True

        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "a.mp3").write_bytes(b"audio")
            with mock.patch.dict(os.environ):
                os.environ.pop("NO_COLOR", None)
                os.environ["TERM"] = "xterm-256color"
                colored = Terminal()
                with mock.patch.object(catalogue.sys, "stdout", colored):
                    catalogue.report_generation(folder)
                output = colored.getvalue()
                self.assertIn("\033[1;35m♫\033[0m", output)
                self.assertIn("\033[1;36mMusic catalogue wrapper v1.0", output)
                self.assertIn("\033[32m+1\033[0m", output)
                self.assertIn("\033[31m-0\033[0m", output)
                self.assertIn(
                    "Music catalogue wrapper v1.0 | branch:",
                    re.sub(r"\033\[[0-9;]*m", "", output),
                )

                for overrides in ({"NO_COLOR": "1"}, {"TERM": "dumb"}):
                    with self.subTest(overrides=overrides):
                        os.environ.pop("NO_COLOR", None)
                        os.environ["TERM"] = "xterm-256color"
                        os.environ.update(overrides)
                        plain = Terminal()
                        with mock.patch.object(catalogue.sys, "stdout", plain):
                            catalogue.report_generation(folder)
                        self.assertNotIn("\033[", plain.getvalue())


if __name__ == "__main__":
    unittest.main()
