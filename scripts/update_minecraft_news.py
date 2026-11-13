#!/usr/bin/env python3
"""Refresh the static Minecraft news data, retaining the last successful feeds."""

import argparse
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
import json
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit
from urllib.request import Request, urlopen
import xml.etree.ElementTree as ET

NEWS_URL = "https://www.minecraft.net/en-us/feeds/community-content/rss"
VIDEOS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UC1sELGmy5jp5fQUugmuYlXQ"
ATOM = "{http://www.w3.org/2005/Atom}"
YOUTUBE = "{http://www.youtube.com/xml/schemas/2015}"
MAX_FEED_BYTES = 2 * 1024 * 1024


def timestamp(value):
    if not isinstance(value, str):
        raise ValueError("Invalid date")
    try:
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        date = parsedate_to_datetime(value)
    if date.tzinfo is None:
        raise ValueError("Date has no timezone")
    return date.astimezone(timezone.utc).isoformat()


def news_link(value):
    if not isinstance(value, str):
        raise ValueError("Invalid Minecraft news link")
    url = urlsplit(value)
    if (url.scheme != "https" or url.hostname not in ("minecraft.net", "www.minecraft.net")
            or url.username or url.password or url.port or not url.path.startswith("/")):
        raise ValueError("Invalid Minecraft news link")
    return value


def item(title, url, published):
    if not isinstance(title, str):
        raise ValueError("Invalid title")
    title = " ".join(title.split())
    if not title or len(title) > 240:
        raise ValueError("Invalid title")
    return {"title": title, "url": url, "published": timestamp(published or "")}


def parse_news(content):
    root = ET.fromstring(content)
    entries = root.findall("./channel/item")
    if root.tag != "rss" or not entries:
        raise ValueError("Minecraft RSS has no items")
    items = []
    for entry in entries:
        try:
            atom_link = entry.find(f"{ATOM}link")
            link = entry.findtext("link") or (atom_link.get("href") if atom_link is not None else "")
            items.append(item(entry.findtext("title"), news_link(link or ""),
                              entry.findtext("pubDate")))
        except ValueError as error:
            print(f"Minecraft news item skipped: {error}", file=sys.stderr)
    return latest(items, 5)


def parse_videos(content):
    root = ET.fromstring(content)
    entries = root.findall(f"{ATOM}entry")
    if root.tag != f"{ATOM}feed" or not entries:
        raise ValueError("YouTube feed has no entries")
    items = []
    for entry in entries:
        try:
            video_id = entry.findtext(f"{YOUTUBE}videoId") or ""
            if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
                raise ValueError("Invalid video ID")
            items.append(item(entry.findtext(f"{ATOM}title"),
                              f"https://www.youtube.com/watch?v={video_id}",
                              entry.findtext(f"{ATOM}published")))
        except ValueError as error:
            print(f"Minecraft video skipped: {error}", file=sys.stderr)
    return latest(items, 2)


def latest(items, limit):
    if not items:
        raise ValueError("Feed has no valid items")
    unique = {entry["url"]: entry for entry in items}
    return sorted(unique.values(), key=lambda entry: entry["published"], reverse=True)[:limit]


def fetch(url):
    request = Request(url, headers={"User-Agent": "gry-darka Minecraft news feed"})
    with urlopen(request, timeout=20) as response:
        content = response.read(MAX_FEED_BYTES + 1)
    if len(content) > MAX_FEED_BYTES:
        raise ValueError("Feed exceeds size limit")
    return content


def validate_previous(data, strict=False):
    empty = {"news": {"updated": None, "items": []}, "videos": {"updated": None, "items": []}}
    if not isinstance(data, dict):
        raise ValueError("Cache is not an object")
    for key in empty:
        try:
            section = data[key]
            if not isinstance(section, dict) or not isinstance(section["items"], list):
                raise ValueError(f"Invalid cached {key} items")
            if section["updated"] is None and not section["items"]:
                continue
            timestamp(section["updated"])
            for entry in section["items"]:
                url = entry["url"]
                if key == "news":
                    news_link(url)
                elif not re.fullmatch(r"https://www\.youtube\.com/watch\?v=[A-Za-z0-9_-]{11}", url):
                    raise ValueError("Invalid cached video link")
                item(entry["title"], url, entry["published"])
            if not section["items"]:
                raise ValueError(f"Empty cached {key} feed")
            empty[key] = section
        except (ValueError, TypeError, KeyError) as error:
            if strict:
                raise ValueError(f"Invalid cached Minecraft {key}: {error}") from error
            print(f"Invalid cached Minecraft {key}: {error}", file=sys.stderr)
    return empty


def load_previous(path, strict=False):
    try:
        return validate_previous(json.loads(path.read_text(encoding="utf-8")), strict=strict)
    except FileNotFoundError:
        if strict:
            raise
        return {"news": {"updated": None, "items": []}, "videos": {"updated": None, "items": []}}
    except (OSError, ValueError) as error:
        if strict:
            raise
        print(f"Invalid news cache: {error}", file=sys.stderr)
        return {"news": {"updated": None, "items": []}, "videos": {"updated": None, "items": []}}


def update_with_report(previous, fetch_feed=None, now=None):
    if fetch_feed is None:
        fetch_feed = fetch
    data = previous.copy()
    sources = {}
    now = (now or datetime.now(timezone.utc)).astimezone(timezone.utc).isoformat()
    for key, url, parser in (("news", NEWS_URL, parse_news), ("videos", VIDEOS_URL, parse_videos)):
        try:
            data[key] = {"updated": now, "items": parser(fetch_feed(url))}
            sources[key] = "refreshed"
        except (OSError, ValueError, ET.ParseError) as error:
            print(f"Could not refresh Minecraft {key}: {error}; keeping last successful data.", file=sys.stderr)
            sources[key] = "retained" if previous[key]["items"] else "unavailable"
    return data, {"sources": sources, "refreshed": sum(status == "refreshed" for status in sources.values())}


def update(previous, fetch_feed=None, now=None):
    return update_with_report(previous, fetch_feed, now)[0]


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--cache", type=Path, default=Path("minecraft-news.json"))
    parser.add_argument("--output", type=Path, default=Path("minecraft-news.json"))
    parser.add_argument("--published-url", help="Use the validated live JSON as the previous cache; fail if unavailable")
    parser.add_argument("--bootstrap", action="store_true", help="Explicitly use the committed cache instead of live data")
    parser.add_argument("--report", type=Path, help="Write per-source refresh results as JSON")
    args = parser.parse_args(argv)
    if args.bootstrap and not args.published_url:
        parser.error("--bootstrap requires --published-url")
    try:
        if args.published_url and not args.bootstrap:
            previous = validate_previous(json.loads(fetch(args.published_url)), strict=True)
        else:
            if args.bootstrap:
                print("Bootstrap requested: using the committed feed seed, not the live cache.", file=sys.stderr)
            previous = load_previous(args.cache, strict=args.bootstrap)
        data, report = update_with_report(previous)
        args.output.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        if args.report:
            args.report.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    except (OSError, ValueError) as error:
        print(f"Minecraft feed refresh aborted: {error}; no deployment should proceed.", file=sys.stderr)
        return 1
    return 0 if report["refreshed"] == 2 else 1


if __name__ == "__main__":
    sys.exit(main())
