import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


spec = importlib.util.spec_from_file_location(
    "music_catalogue", Path(__file__).with_name("generate-music-catalogue.py")
)
catalogue = importlib.util.module_from_spec(spec)
spec.loader.exec_module(catalogue)


class MusicCatalogueTest(unittest.TestCase):
    def test_scans_and_refreshes_only_mp3_files(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "Żółty song.MP3").touch()
            (folder / "a.mp3").touch()
            (folder / "notes.txt").touch()
            (folder / "folder.mp3").mkdir()
            self.assertEqual(catalogue.generate(folder), 2)
            result = json.loads((folder / "catalogue.json").read_text(encoding="utf-8"))
            self.assertEqual(result, [
                {"file": "a.mp3", "title": "a"},
                {"file": "Żółty song.MP3", "title": "Żółty song"},
            ])
            (folder / "a.mp3").unlink()
            (folder / "Żółty song.MP3").unlink()
            self.assertEqual(catalogue.generate(folder), 0)
            self.assertEqual(json.loads((folder / "catalogue.json").read_text()), [])

    def test_invalid_filenames_do_not_replace_the_catalogue(self):
        with tempfile.TemporaryDirectory() as temp:
            folder = Path(temp)
            (folder / "catalogue.json").write_text("existing", encoding="utf-8")
            (folder / "   .mp3").touch()
            with self.assertRaisesRegex(ValueError, "Unsupported MP3 filename"):
                catalogue.generate(folder)
            self.assertEqual((folder / "catalogue.json").read_text(), "existing")


if __name__ == "__main__":
    unittest.main()
