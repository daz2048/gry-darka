# Gry Darka, Janka i Ekipy 🎮

Zbiór małych gier przeglądarowe — **graj od razu, bez instalacji**.

## 🚀 Graj teraz!

**[👉 OTWÓRZ GRY](https://daz2048.github.io/gry-darka/)**

Baner na stronie głównej zmienia efekt przy każdym obrocie. W czerwcu–sierpniu
może pojawić się lato, we wrześniu jesień, w październiku dynie i gwiazdy,
w listopadzie–lutym śnieg, w grudniu motywy świąteczne, w marcu i maju wiosna,
a w kwietniu motywy wielkanocne i wiosenne. Po obróceniu banera mogą pojawić
się bardziej dynamiczne efekty; pierwsze wyświetlenie jest spokojniejsze,
chyba że zapisano tylko jeden motyw.
Wybór motywów zależy od lokalnego miesiąca odwiedzającego.
Ruch obrotu również jest losowy (w lewo, w prawo lub z pomniejszeniem);
przy ustawieniu ograniczonego ruchu baner zmienia stronę bez animacji.
Łącze „Banner styles” obok pogody otwiera galerię wszystkich stylów, w tym
różowe i pomarańczowe motywy, fajerwerki oraz spokojne, wolno zmieniające się
światła sceniczne (bez szybkiego migania). Zmiany wyboru zapisują się automatycznie
lokalnie w przeglądarce. Wybór jednego motywu działa od razu i po odświeżeniu;
kilka motywów zmienia się przy następnym obrocie. „Clear” pozwala zacząć
wybór od nowa, zachowując poprzedni wybór do zaznaczenia nowego motywu;
„Restore defaults” przywraca domyślny wybór sezonowy.
Na początku galerii sekcja „Games” zawiera ciche automatyczne symulacje: Snake,
Zombie Defense, Platformer, Flappy, Archers, Castle Duel, Minecraft Building,
Space Invaders, Pong, Racing i Breakout. Przy ograniczonym ruchu pokazują
nieruchomą scenę, a poza widocznym obszarem i w ukrytej karcie nie zużywają
czasu animacji.

## Weather background

The homepage background follows model-based current weather: sunshine, clouds, fog,
rain, snow, and a dark storm sky (no flashing lightning). Clear and partly cloudy
nights show gently twinkling stars, an occasional decorative shooting star, and a
moon; these are illustrative, not astronomical or actual meteor predictions.
The selected location's sunrise and sunset drive dawn, day, sunset, dusk and night,
with a roughly 45-minute transition on either side of each event. The sun's path is
illustrative, not astronomical. If sunrise or sunset is unavailable (such as during
polar day or night), the background uses the current day/night weather instead.
Sky colors and celestial elements update each minute while visible; cloud and
precipitation effects remain dependent on the weather. Banner effects remain independent.
Animations respect reduced motion and pause in hidden tabs; stars remain static and
shooting stars are hidden when reduced motion is requested.
The weather/location panel is the last content below the footer. The small weather
icon in the top navigation shows the selected location, current temperature and
this hour's rain chance; clicking it jumps to the panel and expands all location
options. Rain chance uses Open-Meteo's hourly precipitation probability (including
snow), matched by timestamp to the selected location's current hour. Missing rain
probability is labelled unavailable without hiding otherwise valid weather.

- On a new visit, [ipwho.is](https://ipwhois.io/documentation) estimates a city from
  the visitor's IP without a device permission prompt. Failed, invalid or rate-limited
  estimates fall back to London. Estimates can be inaccurate with VPNs/mobile networks.
- **Change location** always remains available: search for a city or click
  **Use my location** to request a single browser position. Device coordinates are
  rounded to two decimal places before weather requests or storage; high accuracy
  is disabled, but the browser can still return a precise position.
- Explicit choices are stored in the `gry_weather_location` first-party cookie
  for 180 days, scoped to this site's directory, with `SameSite=Lax` and `Secure`
  on HTTPS. Saved choices skip IP lookup and never trigger location prompts.
  **Use automatic estimate** clears the choice. Blocked cookies produce a warning.
- IP requests disclose the visitor's IP to ipwho.is. Searches and rounded weather
  coordinates are sent to [Open-Meteo](https://open-meteo.com/en/terms); requests
  omit credentials and referrers. No raw device position or IP is stored by this code.
- Weather refreshes every 30 minutes while visible (and on return if due). Network
  errors or stale/invalid weather use the neutral background, not another city's
  weather. Requests time out; the games/menu never wait for weather.

No backend, API key, dependencies, or build step are needed. The free ipwho.is
browser tier currently shares **1,000 requests/day per domain**. Open-Meteo's free
service is non-commercial with **10,000 calls/day**, plus hourly/minute limits.
Revisit provider plans before adding advertising or increasing traffic.
Weather attribution and the CC BY 4.0 link appear beside the controls.

Tests: `node --test scripts/test_weather.js scripts/test_banner.js scripts/test_banner_snake.js`.

## Minecraft news and videos

The homepage has a **Minecraft news** shortcut in the top navigation. It jumps
to a panel below the weather section with official Minecraft.net headlines and
videos from the official Minecraft YouTube channel. These are not updates to our
own Minecraft-inspired game. The panel links directly to the sources even when
JavaScript or the data is unavailable; videos are links, not embedded players.

The panel reads the same-origin `minecraft-news.json` file. To refresh it before
publishing, run `python3 scripts/update_minecraft_news.py` and publish the resulting
file with the site. The script needs no API key or third-party packages. It fetches
the [official Minecraft RSS feed](https://www.minecraft.net/en-us/feeds/community-content/rss)
and the [official YouTube channel feed](https://www.youtube.com/feeds/videos.xml?channel_id=UC1sELGmy5jp5fQUugmuYlXQ),
and reports failures on stderr. If either feed fails, that source keeps its last
successful data and timestamp; an unavailable feed with no earlier data shows a
source link instead. Data is labelled potentially outdated after 24 hours.
The command exits nonzero if either source fails, even though it writes the
retained data and any successful update. `--report PATH` also writes per-source
statuses and the number of refreshed sources as JSON.

### Scheduled publication

The [site workflow](.github/workflows/pages.yml) validates pull requests without
deploying them. After rollout, it publishes the complete static site on pushes
to `main`, manual runs on `main`, and approximately every four hours at minute
17 UTC. Schedules are best-effort; check Actions for failures or disabled runs.
The browser does not contact the feed providers until a visitor follows a link.

Deployment reads and validates the currently published JSON before refreshing.
Generated feed data is included only in the Pages artifact, not committed by a
bot. Normal site releases use the same process, so they do not replace live
feed data with an older committed seed. One failed provider retains its data
and timestamp while the other provider can refresh; the run reports failure
even if the partial update is deployed. If both providers fail on a scheduled
run, the live site is left unchanged. A normal release can still publish site
changes with the retained data. An inaccessible or invalid live cache blocks
deployment instead of silently falling back to the seed.

**Administrator rollout (not performed automatically):**

1. Merge the workflow to `main` and confirm repository workflows are permitted
   by organization policy. Until migration, branch-based Pages remains the
   publishing source and manual refresh is still needed.
2. Make **Site checks** required for merging into `main` through branch
   protection or a ruleset. The checks are advisory until this is configured.
3. Change Settings → Pages → Build and deployment → Source to **GitHub Actions**,
   then manually run **Site validation and deployment** on `main`.
4. Verify the deployed homepage, existing games, and feed timestamps. Confirm
   an actual scheduled run updates the live feed. The workflow also compares
   the published JSON against its deployment artifact, with bounded retries.

Manual dispatch has a `bootstrap` option, defaulting to false. Enable it only
for initial setup without a valid live cache or deliberate recovery: it uses
the validated committed seed and may replace newer live data. It does not
bypass provider failures. Production runs are serialized and superseded
source revisions are skipped. Publishing needs only content-read permission
plus Pages-write and an ID token; no personal access token is required.

For rollback, an administrator can restore Pages publishing from `main` at
the repository root. Refresh and commit the feed manually first if the
committed seed is older than the live data; artifact-only updates are not
written back to the branch.

Tests: `python3 -m unittest discover -s scripts -p 'test_minecraft_news.py'`
and `node --test scripts/test_minecraft_news.js`.

## Pomoc i aktualizacje dla graczy

- [Jak grać / How to play](help.html): cele, sterowanie według wersji,
  zapisy i rozwiązywanie problemów, po polsku i angielsku.
- [Co nowego / Release notes](updates.html): datowana historia zmian dla graczy,
  od najnowszych. Nie zastępuje planów rozwoju ani dokumentacji technicznej.
- [Publikowanie pomocy i informacji o wydaniach](runbooks/player-updates.md):
  aktualizuj obie wersje językowe razem ze zmianą gry; po publikacji sprawdź
  stronę online. Sam push gałęzi roboczej nie oznacza wdrożenia GitHub Pages.

---

## Wspólna muzyka

Pliki MP3, WAV, OGG i M4A dla gier znajdują się w katalogu `music/`. Po dodaniu lub usunięciu
utworów uruchom `scripts/generate-music-catalogue.sh` z katalogu repozytorium
i odśwież grę. Do publikacji należy zapisać w Git zarówno zmiany
plików audio, jak i wygenerowany `music/catalogue.json`. Obsługa formatów i
kodeków zależy od przeglądarki. Publikuj tylko utwory, które
masz prawo udostępniać: pliki na stronie są publiczne.
Szczegóły i wymagania dla przyszłej automatyzacji znajdują się w
[runbooku katalogu muzyki](runbooks/music-catalogue.md).

---

## Google Search Console

Mapa witryny znajduje się w [sitemap.xml](sitemap.xml). Dodawaj do niej nowe
publiczne strony gier. Po opublikowaniu zmian na GitHub Pages:

1. W [Google Search Console](https://search.google.com/search-console/) dodaj
   usługę z prefiksem URL `https://daz2048.github.io/gry-darka/`.
2. Wybierz weryfikację za pomocą tagu HTML, dodaj tag otrzymany od Google do
   sekcji `<head>` strony głównej i opublikuj zmianę. Następnie wybierz **Verify**.
3. W sekcji **Sitemaps** prześlij adres
   `https://daz2048.github.io/gry-darka/sitemap.xml`.
4. W **URL Inspection** sprawdź adres strony głównej i wybierz **Request indexing**.

Plik [robots.txt](robots.txt) w tym repozytorium jest publikowany w podkatalogu
`/gry-darka/`. Google odczytuje jednak tylko plik znajdujący się w katalogu
głównym domeny, czyli `https://daz2048.github.io/robots.txt`. Aby użyć tych
dyrektyw, trzeba opublikować je pod tym adresem; mapa może być przesłana
bezpośrednio w Search Console także bez tego pliku. Zgłoszenie nie gwarantuje
indeksowania ani pozycji w wynikach.

---

## 💻 Lokalny serwer gier (macOS)

Z katalogu repozytorium uruchom:

```bash
./scripts/game-server.sh
```

Otwórz **http://localhost:8765/** lub np. **http://localhost:8765/ragdoll-archers/**. Serwer działa w tle także po zamknięciu terminala, dopóki trwa sesja użytkownika macOS.

Monitor pokazuje ostatnie i nowe żądania oraz liczbę żądań i błędów HTTP od momentu podłączenia. Kolory oznaczają klasy odpowiedzi HTTP; ustaw `NO_COLOR=1`, aby je wyłączyć. Ctrl+C zamyka monitor, ale nie zatrzymuje serwera. Ponowne uruchomienie monitora podłącza go do działającego serwera.

W monitorze naciskaj pojedyncze klawisze (bez Enter):

- `r` — uruchom serwer ponownie
- `s` — sprawdź stan serwera
- `q` — zamknij monitor, pozostawiając serwer w tle
- `x` — zatrzymaj serwer i zamknij monitor
- `d` — włącz lub wyłącz diagnostykę wrappera
- `h` lub `?` — pokaż skróty

Diagnostykę można też włączyć od razu flagą `-d` lub `--debug`, np. `./scripts/game-server.sh --debug`. Pokazuje dodatkowe informacje o działaniach wrappera na standardowym wyjściu błędów; `d` przełącza ją podczas pracy monitora. Pomoc `--help` i skróty monitora mają kolorowe nagłówki i polecenia; `NO_COLOR=1`, `TERM=dumb` lub przekierowanie wyjścia wyłączają kolory.

Skróty `r`, `s`, `q`, `x` i `h` działają też jako argumenty skryptu, np. `./scripts/game-server.sh s` sprawdza stan bez otwierania monitora. Flagę debugowania można łączyć z akcją, np. `./scripts/game-server.sh --debug --restart`. Sterowanie klawiszami jest aktywne tylko przy wejściu z terminala; wejście z potoku zachowuje tryb samego podglądu logów.

```bash
./scripts/game-server.sh --restart      # uruchom ponownie i podłącz monitor (również -r)
./scripts/game-server.sh --help         # pokaż szczegółową pomoc (również -h)
python3 scripts/game-server.py restart  # uruchom ponownie (lub uruchom, jeśli nie działa)
python3 scripts/game-server.py status   # sprawdź stan
python3 scripts/game-server.py stop     # zatrzymaj
```

Serwer nasłuchuje tylko na tym komputerze. Pliki statyczne są odczytywane na bieżąco, więc zwykle wystarczy odświeżyć stronę; gdy przeglądarka używa pamięci podręcznej, wykonaj twarde odświeżenie. Ten skrypt wymaga Python 3 i zalogowanej sesji macOS. W razie błędu wskazuje plik dziennika.

Dziennik żądań HTTP i błędów serwera jest przechowywany w `~/Library/Application Support/gry-darka/`; dokładną ścieżkę pokazuje monitor i `--help`. Po osiągnięciu 1 MiB plik jest rotowany: zachowywany jest bieżący plik oraz trzy starsze (`.1`–`.3`), bez limitu wieku. Katalog i pliki dziennika są dostępne tylko dla właściciela. Dziennik nie zawiera konsoli przeglądarki ani diagnostyki wrappera, która trafia do terminala. Aby włączyć rotację dla już działającego serwera, uruchom go ponownie (`r` w monitorze lub `./scripts/game-server.sh --restart`).

Opcja restart zatrzymuje również ręcznie uruchomiony serwer tego repozytorium na porcie 8765. Nie zatrzymuje niezwiązanych procesów zajmujących ten port.

### Opcjonalne skróty terminala

```bash
./scripts/game-server.sh --install-aliases              # tylko game-server
./scripts/game-server.sh --install-aliases --with-game  # game-server i game
./scripts/game-server.sh --uninstall-aliases            # usuń zarządzany blok
```

Instalacja jest wyłącznie na żądanie, dla zsh lub bash. Przed dodaniem każdego skrótu sprawdza aliasy, funkcje, polecenia wbudowane i programy w `PATH` w nowej interaktywnej sesji powłoki logowania. Zajęte nazwy są pomijane; `ga` nie jest instalowany. Lokalne aliasy zdefiniowane tylko w już otwartym terminalu nie są widoczne dla instalatora, ale blok sprawdza konflikty ponownie podczas ładowania i nie nadpisuje istniejących nazw.

Blok trafia do `.zshrc` (z uwzględnieniem `ZDOTDIR`) albo pierwszego używanego pliku startowego bash (`.bash_profile`, `.bash_login`, `.profile`). Przed zmianą istniejącego pliku powstaje kopia zapasowa; ponowna instalacja nie dodaje duplikatów. Aby zmienić wybór skrótów, najpierw je odinstaluj. Odinstalowanie usuwa tylko oznaczony blok, nie inne ustawienia.

Po instalacji otwórz nowy terminal: `game-server`, `game-server s`, `game-server --restart` i opcjonalnie `game` działają z dowolnego katalogu. Skróty wskazują bezwzględną ścieżkę repozytorium; po jego przeniesieniu odinstaluj je i zainstaluj ponownie. Zmiany nie modyfikują aliasów w już otwartych terminalach; po odinstalowaniu zamknij je albo usuń odpowiednie aliasy ręcznie.

---

## ⌨️ Szybka nawigacja: **ESC** lub **H**

Z dowolnej gry wciśnij **ESC** albo **H**, aby wrócić do menu głównego.
Wyjątek: **Klocki Podlasia 0.1** i **Minecraft 0.2+** używają **ESC** do pauzy i uwolnienia myszy.
Do menu gier wrócisz tam przez **H** lub przycisk **Menu gier**.

---

## 📋 Dostępne gry

### Klocki Podlasia 0.1 — prototyp
Oryginalny świat klocków 3D: podlaska łąka, drzewa i domek. Spaceruj, usuwaj
klocki i buduj z ośmiu materiałów bez limitu.
- **Sterowanie:** WASD / strzałki, spacja: skok, mysz: widok, Q / E: usuń / dodaj,
  1–8: materiał. ESC / P: pauza, H: menu gier.
- Na komputer z klawiaturą i WebGL2; dostępny też widok obracany przeciąganiem.
- Model pierwszego etapu, **bez zapisu świata**, dźwięku i sterowania dotykowego.
- [Zagraj »](klocki-podlasia-0.1/)
- [Instrukcja, ograniczenia i testy](klocki-podlasia-0.1/README.md)
- [Ocena i plan dalszego rozwoju](backlog/voxel-sandbox-backlog.md)

### Minecraft 0.2 — wersja rozwojowa
Osobna kopia wersji 0.1 do dalszego rozwoju na galezi `feature/klocki-podlasia-0.2`.
Domyslnym katalogiem pracy na tej galezi jest `klocki-podlasia-0.2/`; wersja 0.1 pozostaje zachowana.
Na poczatku obie wersje maja ten sam swiat, sterowanie i ograniczenia prototypu.
- [Zagraj »](klocki-podlasia-0.2/)
- [Instrukcja, ograniczenia i testy](klocki-podlasia-0.2/README.md)

### Minecraft 0.5 — wersja rozwojowa
Punkt wyjścia to Minecraft 0.4. Bieżące prace prowadzone są w `minecraft/0.5/`
na gałęzi `Minecraft-0.5`. Starsze wydania pozostają w dotychczasowych katalogach
i pod tymi samymi adresami. Nowe wersje trafiają do `minecraft/<wersja>/`;
niezmienne biblioteki mają przypięte wersje w `minecraft/shared/vendor/`.
Kod gry i zapisy pozostają niezależne dla każdego wydania. Światy 0.4 można
przenieść przez eksport i import kopii zapasowej, bez zmieniania oryginału.
- [Zagraj »](minecraft/0.5/)
- [Instrukcja, zapisy i testy](minecraft/0.5/README.md)
- [Wybór wersji](minecraft/)
- [Struktura i zasady współdzielenia bibliotek](minecraft/README.md)

### Minecraft 0.4 — archiwum
Zachowane wydanie, niezależne od rozwoju wersji 0.5.
- [Zagraj »](klocki-podlasia-0.4/)
- [Instrukcja, zapisy i testy](klocki-podlasia-0.4/README.md)

### Minecraft 0.3 — archiwum
Odkrywaj duży świat Podlasia, buduj z 37 nieograniczonych materiałów i wracaj
do swojej pracy dzięki zapisowi lokalnemu w Chrome. Wydanie koncentruje się na
komputerach Mac z klawiaturą i myszą; inne przeglądarki nie są jeszcze
potwierdzonym celem wsparcia. Bez trybu przetrwania, craftingu, multiplayera
i sterowania dotykowego.
- [Zagraj w zarchiwizowane wydanie »](klocki-podlasia-0.3/)
- [Instrukcja, zapisy i testy](klocki-podlasia-0.3/README.md)
- [Plan wydania i wyniki weryfikacji](backlog/voxel-sandbox-backlog.md)

### Flappy Bird 0.2
Wersja rozwojowa, skopiowana z 0.1. W menu portfolio wersja 0.1 jest pierwsza, a 0.2 druga. Dalsze zmiany na galezi `archer-0.4-works-starts-n0w` dotycza domyslnie katalogu `flappy-0.2/`.
- [Zagraj »](flappy-0.2/)
- [Szczegoly](flappy-0.2/README.md)

### Flappy Podlasie 0.1
Zachowane pierwsze wydanie gry w stylu Flappy Bird: przelatuj przez drewniane bramy nad podlaska laka i pobij swoj rekord.
- **Sterowanie:** dotyk / klikniecie / spacja / strzalka w gore; P: pauza; M: dzwiek; H / Esc: menu gier.
- Rekord i ustawienie dzwieku zapisywane lokalnie. Brak zapisu nie blokuje gry.
- [Zagraj »](flappy-0.1/)
- [Szczegoly](flappy-0.1/README.md)

### Ragdoll Archers
Self-hosted Unity WebGL build of the ragdoll archery game.
- [Zagraj »](ragdoll-archers/)
- Original game by Ericetto; package distributed under the upstream repository's MIT License.

### Archers 0.4
Separate clone of Archers 0.3, ready for further development. Adds scatter, armor-piercing, burning, shock, quake, and homing arrows, plus armor, medkits, stackable shields, regeneration, temporary damage guard, thorns, and health upgrades. Rivals carry different arrow types and occasionally fall over and recover when hit. Archers 0.3 remains intact.
- Tougher, faster rivals: regular mobs start at 180 health, gain 10 per round up to 300, move over twice as fast, and shoot sooner and more often. Bosses have 3000 health.
- Armor has 30 levels, with purple armor from level 25 and blue-and-gold armor at the maximum. Press **N** during a duel for level 30 armor, full health, and invincibility; this also clears burning, poison, and freezing. Restarting resets the bonus.
- Buy and freely switch between Standard, Steel (25% less impact damage), Fireproof (no burning), Insulated (resists charge interruptions), Antidote (no poison), and Mirror (25% reflected damage) armor. One type is equipped at a time; armor levels and N invincibility remain independent of the selected type.
- Defense items include Barrier (5 seconds of full invincibility), Cleanse (removes harmful statuses), and Full Repair (restores all health). Shield charges block hits; Guard reduces damage; Thorns stacks with Mirror reflection. Shop descriptions explain each effect.
- [Play »](archers-0.4/)
- [Original editable Unity game: assessment and implementation backlog](backlog/README.md)

### Mario 0.1
Klasyczny wariant platformowej przygody z trzema światami, przeciwnikami, monetami i punktami kontrolnymi.
- **Sterowanie:** strzałki / A i D, skok: spacja / W / strzałka w górę; na telefonie przyciski dotykowe.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/mario-0.1/)
- [Instrukcja i szczegóły](mario-0.1/README.md)

### Mario 0.2
Pierwsze wydanie przygody Maksa, zachowane jako osobna wersja.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/mario-0.2/)
- [Instrukcja i szczegóły](mario-0.2/README.md)

### Mario 0.3 (Maks Jump Quest)
Najnowsza wersja platformowej przygody Maksa: 100 poziomów, zmienne światy i sześć rodzajów przeciwników.
- **Sterowanie:** strzałki / A i D, skok: spacja / W / strzałka w górę; na telefonie przyciski dotykowe.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/mario-0.3/)
- [Instrukcja i szczegóły](mario-0.3/README.md)

### 🏰 Pojedynek Zamków
Artyleria turowa dla 2 graczy (hotseat). Ustaw kąt i moc, uwzględnij wiatr i zniszcz zamek przeciwnika.
- **Gracze:** Janek i Darek
- [Zagraj »](https://dariusz22p.github.io/gry-darka/pojedynek-zamkow-janek-i-baranek/)

### 🧟 Napór Zombie — Warianty

#### Napór Zombie (Vanilla)
Oryginalna gra — broń bazę przed falami zombie. Przesuwaj ekipę w pionie, strzelaj prosto, dobieraj ludzi i moc.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/napor-zombie-vanilla/)

#### Zombie Max 0.1 (prowadzony przez Maksa)
Dotychczasowy wariant Maksa.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/zombie-max-0.1/)

#### Zombie Max 0.2 (dostępny)
Nowa wersja dostępna jako osobny wariant.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/zombie-max-0.2/)

#### Zombie Aleksa
Wariant dla zespołu AX.
- [Zagraj »](https://dariusz22p.github.io/gry-darka/zombie-aleksa/)

---

> **💡 Szybki powrót z gry:** Wciśnij **ESC** lub **H** z dowolnej gry, aby wrócić do menu głównego.

---

## ⌨️ Sterowanie

### Zombie (wszystkie warianty)
- **↑/W** — ruch w górę
- **↓/S** — ruch w dół
- **SPACEBAR** — bomba zwykła
- **N** — bomba atomowa
- **P** — pauza
- **F** — pełny ekran
- **R** — restart
- **M** — wyciszenie dźwięku
- **ESC** / **H** — powrót do menu głównego

### Pojedynek Zamków
- Używaj myszy do ustawiania kąta i mocy
- **SPACEBAR** — strzał

---

## 📱 Kompatybilność

- ✅ Desktop (Chrome, Firefox, Edge, Safari)
- ✅ Mobile / Tablet
- ✅ Offline mode (PWA dla Pojedynku Zamków)

---

## 📝 Technologia

- **HTML5 + Canvas** — renderowanie gier
- **Vanilla JavaScript** — bez frameworków
- **Web Audio API** — dźwięki syntetyzowane
- **GitHub Pages** — hosting

---

## 👨‍💻 Deweloperzy

- **Dariusz Panasiuk** — Główny autor, GitHub Pages hosting
- **Maksymilian Panasiuk** — Prowadzący warianty Max
- **Aleksander Panasiuk** — Prowadzący wariant AX
- **Janek** — Prowadzący wariant Jan, współautor Pojedynku Zamków

---

## 📦 Źródło

Repo: [github.com/dariusz22p/gry-darka](https://github.com/dariusz22p/gry-darka)

---

**Miłej zabawy!** 🎮
