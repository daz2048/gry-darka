import unittest
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]


class PageLinks(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.ids = set()
        self.links = []
        self.feed(path.read_text(encoding="utf-8"))

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            self.ids.add(attrs["id"])
        if tag == "a" and "href" in attrs:
            self.links.append(attrs)


class PlayerHelpTest(unittest.TestCase):
    def assert_local_destination(self, source, href):
        url = urlsplit(href)
        if url.scheme or url.netloc:
            return
        destination = (source.parent / unquote(url.path)).resolve() if url.path else source
        if destination.is_dir():
            destination /= "index.html"
        self.assertTrue(destination.is_file(), f"{source.name}: missing {href}")
        if url.fragment and destination.suffix == ".html":
            self.assertIn(unquote(url.fragment), PageLinks(destination).ids,
                          f"{source.name}: missing anchor in {href}")

    def test_player_pages_have_working_local_links_and_permalinks(self):
        for name in ("help.html", "updates.html", "minecraft/index.html",
                     "minecraft/0.5/index.html"):
            source = ROOT / name
            for link in PageLinks(source).links:
                with self.subTest(page=name, href=link["href"]):
                    self.assert_local_destination(source, link["href"])

    def test_minecraft_archive_h_shortcut_returns_to_games_home(self):
        source = ROOT / "minecraft/index.html"
        games_link = next(link for link in PageLinks(source).links
                          if link["href"] == "../index.html"
                          and link.get("aria-keyshortcuts") == "H")
        self.assert_local_destination(source, games_link["href"])
        html = source.read_text(encoding="utf-8")
        self.assertIn("document.addEventListener('keydown'", html)
        self.assertIn("window.location.href = '../index.html';", html)

    def test_portfolio_games_link_to_help_without_replacing_the_game_tab(self):
        cards = [link for link in PageLinks(ROOT / "index.html").links
                 if "card" in link.get("class", "").split()]
        self.assertTrue(cards)
        for card in cards:
            if card["href"] == "ragdoll-archers/":
                continue  # The vanilla reference must stay frozen.
            entry = ROOT / card["href"]
            if entry.is_dir():
                entry /= "index.html"
            guides = [link for link in PageLinks(entry).links
                      if "player-guide" in link.get("class", "").split()]
            with self.subTest(game=card["href"]):
                self.assertTrue(guides, "Missing contextual help")
                for guide in guides:
                    self.assertEqual(guide.get("target"), "_blank")
                    self.assertIn("noopener", guide.get("rel", "").split())
                    self.assert_local_destination(entry, guide["href"])


if __name__ == "__main__":
    unittest.main()
