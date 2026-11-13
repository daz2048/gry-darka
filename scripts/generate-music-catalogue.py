#!/usr/bin/env python3
"""Generate the shared music catalogue from supported audio files."""

import argparse
from collections import Counter
import json
import os
from pathlib import Path
import subprocess
import sys
import time

SUPPORTED_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a"}
WRAPPER_VERSION = "1.0"
REPOSITORY_ROOT = Path(__file__).resolve().parent.parent


def colorize(text, color):
    if not sys.stdout.isatty() or "NO_COLOR" in os.environ or os.environ.get("TERM") == "dumb":
        return text
    return f"\033[{color}m{text}\033[0m"


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

    print(
        f"{colorize('♫', '1;35')} "
        f"{colorize(f'Music catalogue wrapper v{WRAPPER_VERSION}', '1;36')} | "
        f"branch: {colorize(branch_name(), '35')}"
    )
    print(f"\n{colorize('>>> Catalogue', '1;36')}")
    print(f"Scanned directory: {directory.resolve()}")
    change_color = "32" if change in {"created", "updated"} else "33"
    print(
        f"{colorize('Catalogue:', '36')} {destination} "
        f"{colorize(f'({change})', change_color)}"
    )
    print(f"\n{colorize('>>> Track changes', '1;36')}")
    new_files = {path.name for path in files}
    old_files = None
    if previous is not None:
        try:
            old_tracks = json.loads(previous)
            if not isinstance(old_tracks, list) or not all(
                isinstance(track, dict) and isinstance(track.get("file"), str)
                for track in old_tracks
            ):
                raise ValueError("unexpected catalogue format")
        except (ValueError, UnicodeDecodeError):
            print(f"{colorize('Track changes:', '36')} "
                  f"{colorize('unavailable (previous catalogue was invalid)', '33')}")
        else:
            old_files = {track["file"] for track in old_tracks}
    else:
        old_files = set()

    if old_files is not None:
        added = sorted(new_files - old_files)
        removed = sorted(old_files - new_files)
        suffix = f" {colorize('(new catalogue)', '33')}" if previous is None else ""
        print(
            f"{colorize('Track changes:', '36')} "
            f"{colorize(f'+{len(added)}', '32')} / "
            f"{colorize(f'-{len(removed)}', '31')}{suffix}"
        )
        if added:
            print("Added to catalogue:")
            for name in added:
                print(f"  + {json.dumps(name, ensure_ascii=False)}")
        else:
            print("No new songs added.")
        if removed:
            print("Removed from catalogue:")
            for name in removed:
                print(f"  - {json.dumps(name, ensure_ascii=False)}")
        else:
            print("No songs removed.")

    formats = Counter(path.suffix.lower().lstrip(".") for path in files)
    format_summary = ", ".join(f"{extension}: {count}" for extension, count in sorted(formats.items()))
    total_bytes = sum(path.stat().st_size for path in files)
    print(f"\n{colorize('>>> Summary', '1;36')}")
    print(f"{colorize('Stats:', '36')} {len(files)} track(s) | {total_bytes:,} audio bytes | "
          f"formats: {format_summary or 'none'} | {time.monotonic() - started:.3f}s")
    print(f"\n{colorize('>>> Next steps', '1;36')}")
    print(colorize(
        "Next: review the catalogue and audio changes; include both when publishing.",
        "1;33",
    ))


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
