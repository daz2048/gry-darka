import contextlib
from datetime import datetime, timezone
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

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

    def previous(self):
        with contextlib.redirect_stderr(io.StringIO()):
            return {
                "news": {"updated": "2026-11-10T12:00:00+00:00", "items": news.parse_news(RSS)},
                "videos": {"updated": "2026-11-10T12:00:00+00:00", "items": news.parse_videos(ATOM)},
            }

    def test_refresh_report_distinguishes_partial_and_total_failure(self):
        previous = self.previous()
        for failed in ({news.NEWS_URL}, {news.NEWS_URL, news.VIDEOS_URL}):
            with self.subTest(failed=failed):
                def fetch(url):
                    if url in failed:
                        raise TimeoutError("unavailable")
                    return RSS if url == news.NEWS_URL else ATOM

                with contextlib.redirect_stderr(io.StringIO()):
                    data, report = news.update_with_report(previous, fetch)
                self.assertEqual(report["refreshed"], 2 - len(failed))
                self.assertEqual(report["sources"]["news"], "retained")
                self.assertEqual(data["news"], previous["news"])
                if len(failed) == 2:
                    self.assertEqual(data, previous)
                else:
                    self.assertEqual(report["sources"]["videos"], "refreshed")

    def test_invalid_live_cache_aborts_without_overwriting_output_or_using_seed(self):
        previous = self.previous()
        for content in (b"not json", json.dumps({**previous, "news": None}).encode()):
            with self.subTest(content=content), tempfile.TemporaryDirectory() as directory:
                output = Path(directory) / "output.json"
                seed = Path(directory) / "seed.json"
                report = Path(directory) / "report.json"
                output.write_text("do not replace", encoding="utf-8")
                seed.write_text(json.dumps(previous), encoding="utf-8")
                with patch.object(news, "fetch", return_value=content) as fetch:
                    with contextlib.redirect_stderr(io.StringIO()) as errors:
                        code = news.main(["--published-url", "https://example.test/minecraft-news.json",
                                          "--cache", str(seed), "--output", str(output), "--report", str(report)])
                self.assertEqual(code, 1)
                self.assertEqual(output.read_text(), "do not replace")
                self.assertFalse(report.exists())
                fetch.assert_called_once()
                self.assertIn("refresh aborted", errors.getvalue())

    def test_live_cache_failure_is_not_a_bootstrap(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.json"
            with patch.object(news, "fetch", side_effect=TimeoutError("unavailable")):
                with contextlib.redirect_stderr(io.StringIO()):
                    code = news.main(["--published-url", "https://example.test/minecraft-news.json",
                                      "--output", str(output)])
            self.assertEqual(code, 1)
            self.assertFalse(output.exists())

    def test_cli_publishes_successful_source_and_reports_failure(self):
        previous = self.previous()
        live_url = "https://example.test/minecraft-news.json"

        def fetch(url):
            if url == live_url:
                return json.dumps(previous).encode()
            if url == news.NEWS_URL:
                raise TimeoutError("unavailable")
            return ATOM

        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "output.json"
            report = Path(directory) / "report.json"
            with patch.object(news, "fetch", side_effect=fetch):
                with contextlib.redirect_stderr(io.StringIO()):
                    code = news.main(["--published-url", live_url, "--output", str(output),
                                      "--report", str(report)])
            self.assertEqual(code, 1)
            self.assertEqual(json.loads(output.read_text())["news"], previous["news"])
            self.assertEqual(json.loads(report.read_text())["refreshed"], 1)

    def test_bootstrap_requires_and_uses_a_valid_seed(self):
        previous = self.previous()
        with tempfile.TemporaryDirectory() as directory:
            seed = Path(directory) / "seed.json"
            output = Path(directory) / "output.json"
            seed.write_text(json.dumps(previous), encoding="utf-8")
            with patch.object(news, "fetch") as fetch:
                with patch.object(news, "update_with_report", return_value=(
                        previous, {"sources": {"news": "refreshed", "videos": "refreshed"}, "refreshed": 2})):
                    with contextlib.redirect_stderr(io.StringIO()):
                        code = news.main(["--published-url", "https://example.test/minecraft-news.json",
                                          "--bootstrap", "--cache", str(seed), "--output", str(output)])
            self.assertEqual(code, 0)
            fetch.assert_not_called()
            self.assertEqual(json.loads(output.read_text()), previous)
            seed.write_text("invalid", encoding="utf-8")
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(news.main(["--published-url", "https://example.test/minecraft-news.json",
                                            "--bootstrap", "--cache", str(seed), "--output", str(output)]), 1)


if __name__ == "__main__":
    unittest.main()
