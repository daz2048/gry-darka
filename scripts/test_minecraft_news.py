import contextlib
from datetime import datetime, timezone
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("minecraft_news", Path(__file__).with_name("update_minecraft_news.py"))
news = importlib.util.module_from_spec(spec)
spec.loader.exec_module(news)

RSS = b"""<rss xmlns:atom="http://www.w3.org/2005/Atom"><channel>
  <item><title>New update</title><atom:link href="https://www.minecraft.net/en-us/article/update"/>
    <pubDate>Tue, 10 Nov 2026 14:00:00 GMT</pubDate></item>
  <item><title>Bad link</title><link>https://evil.example/</link>
    <pubDate>Tue, 10 Nov 2026 14:00:00 GMT</pubDate></item>
</channel></rss>"""
ATOM = b"""<feed xmlns="http://www.w3.org/2005/Atom" xmlns:yt="http://www.youtube.com/xml/schemas/2015">
  <entry><title>New video</title><yt:videoId>x7nvbiNKkio</yt:videoId>
    <published>2026-11-10T18:00:27+00:00</published></entry>
</feed>"""


class MinecraftNewsTests(unittest.TestCase):
    def test_feeds_are_parsed_and_untrusted_links_are_rejected(self):
        with contextlib.redirect_stderr(io.StringIO()):
            articles = news.parse_news(RSS)
        self.assertEqual(len(articles), 1)
        self.assertEqual(articles[0]["url"], "https://www.minecraft.net/en-us/article/update")
        self.assertEqual(articles[0]["published"], "2026-11-10T14:00:00+00:00")
        self.assertEqual(news.parse_videos(ATOM)[0]["url"], "https://www.youtube.com/watch?v=x7nvbiNKkio")
        with contextlib.redirect_stderr(io.StringIO()):
            with self.assertRaises(ValueError):
                news.parse_videos(ATOM.replace(b"x7nvbiNKkio", b"invalid"))

    def test_failure_retains_only_the_affected_sources_previous_data(self):
        with contextlib.redirect_stderr(io.StringIO()):
            previous = {
                "news": {"updated": "2026-11-10T12:00:00+00:00", "items": news.parse_news(RSS)},
                "videos": {"updated": None, "items": []},
            }

        def fetch(url):
            if url == news.NEWS_URL:
                raise TimeoutError("unavailable")
            return ATOM

        with contextlib.redirect_stderr(io.StringIO()) as errors:
            result = news.update(previous, fetch, datetime(2026, 11, 13, tzinfo=timezone.utc))
        self.assertEqual(result["news"], previous["news"])
        self.assertEqual(result["videos"]["updated"], "2026-11-13T00:00:00+00:00")
        self.assertIn("Could not refresh Minecraft news", errors.getvalue())

    def test_invalid_cached_source_does_not_discard_the_other(self):
        data = {
            "news": {"updated": "bad date", "items": []},
            "videos": {"updated": "2026-11-13T00:00:00+00:00", "items": news.parse_videos(ATOM)},
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "cache.json"
            path.write_text(json.dumps(data), encoding="utf-8")
            with contextlib.redirect_stderr(io.StringIO()) as errors:
                result = news.load_previous(path)
        self.assertEqual(result["news"], {"updated": None, "items": []})
        self.assertEqual(result["videos"], data["videos"])
        self.assertIn("Invalid cached Minecraft news", errors.getvalue())


if __name__ == "__main__":
    unittest.main()
