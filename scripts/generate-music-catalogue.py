#!/usr/bin/env python3
"""Generate the shared music catalogue from supported audio files."""

import argparse
from collections import Counter
import json
from pathlib import Path
import subprocess
import time

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a"}
WRAPPER_VERSION = "1.0"
REPOSITORY_ROOT = Path(__file__).resolve().parent.parent


def generate_catalogue(directory):
    files = [
        path for path in directory.iterdir()
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS
    ]
    for path in files:
        if "\\" in path.name or not path.stem.strip():
            raise ValueError(f"Unsupported audio filename: {path.name!r}")
    tracks = [
        {"file": path.name, "title": path.stem}
        for path in files
    ]
    tracks.sort(key=lambda track: track["file"])
    (directory / "catalogue.json").write_text(
        json.dumps(tracks, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    return files


def generate(directory):
    return len(generate_catalogue(directory))


def branch_name():
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=REPOSITORY_ROOT, text=True, capture_output=True, check=False,
        )
    except FileNotFoundError:
        return "unavailable (git not installed)"
    if result.returncode:
        return "unavailable (not a git checkout or git failed)"
    return "detached HEAD" if result.stdout.strip() == "HEAD" else result.stdout.strip()


def report_generation(directory):
    started = time.monotonic()
    destination = directory / "catalogue.json"
    try:
        previous = destination.read_bytes()
    except FileNotFoundError:
        previous = None

    files = generate_catalogue(directory)
    current = destination.read_bytes()
    if previous is None:
        change = "created"
    elif previous == current:
        change = "unchanged"
    else:
        change = "updated"

    print(f"Music catalogue wrapper v{WRAPPER_VERSION} | branch: {branch_name()}")
    print(f"Catalogue: {destination} ({change})")
    if previous is not None:
        try:
            old_tracks = json.loads(previous)
            if not isinstance(old_tracks, list) or not all(
                isinstance(track, dict) and isinstance(track.get("file"), str)
                for track in old_tracks
            ):
                raise ValueError("unexpected catalogue format")
        except (ValueError, UnicodeDecodeError):
            print("Track changes: unavailable (previous catalogue was invalid)")
        else:
            old_files = {track["file"] for track in old_tracks}
            new_files = {path.name for path in files}
            print(f"Track changes: +{len(new_files - old_files)} / -{len(old_files - new_files)}")
    else:
        print(f"Track changes: +{len(files)} / -0 (new catalogue)")

    formats = Counter(path.suffix.lower().lstrip(".") for path in files)
    format_summary = ", ".join(f"{extension}: {count}" for extension, count in sorted(formats.items()))
    total_bytes = sum(path.stat().st_size for path in files)
    print(f"Stats: {len(files)} track(s) | {total_bytes:,} audio bytes | "
          f"formats: {format_summary or 'none'} | {time.monotonic() - started:.3f}s")
    print("Next: review the catalogue and audio changes; include both when publishing.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "directory", nargs="?", type=Path,
        default=REPOSITORY_ROOT / "music",
    )
    parser.add_argument("--wrapper-report", action="store_true", help=argparse.SUPPRESS)
    args = parser.parse_args()
    if args.wrapper_report:
        report_generation(args.directory)
    else:
        count = generate(args.directory)
        print(f"Generated {args.directory / 'catalogue.json'} with {count} track(s).")
