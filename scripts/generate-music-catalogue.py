#!/usr/bin/env python3
"""Generate the shared music catalogue from the MP3 files in a directory."""

import argparse
import json
from pathlib import Path


def generate(directory):
    files = [
        path for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() == ".mp3"
    ]
    for path in files:
        if "\\" in path.name or not path.stem.strip():
            raise ValueError(f"Unsupported MP3 filename: {path.name!r}")
    tracks = [
        {"file": path.name, "title": path.stem}
        for path in files
    ]
    tracks.sort(key=lambda track: track["file"])
    (directory / "catalogue.json").write_text(
        json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return len(tracks)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory", nargs="?", type=Path,
        default=Path(__file__).resolve().parent.parent / "music",
    )
    args = parser.parse_args()
    count = generate(args.directory)
    print(f"Generated {args.directory / 'catalogue.json'} with {count} track(s).")
