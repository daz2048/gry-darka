# Minecraft 0.3 — kreatywne budowanie

Desktopowa gra kreatywna: odkrywaj świat, buduj i wracaj do swojej pracy.
Wersja docelowa do testów wydania to Chrome na macOS z klawiaturą i myszą.
Pozostałe przeglądarki i platformy nie są obecnie potwierdzonymi celami wsparcia.

Original desktop-first creative voxel sandbox for Ekipa spod Lipy. Explore a
256 × 32 × 256 world with eleven biomes, three lakes and two streams, visit seventeen linked villages, and build with 37
unlimited materials. Includes furnished cottages, village wells, trees, roaming farm
animals, foxes, rabbits, iron golems, mineable ore veins, bounded terrain, nearby exposed-face chunk
rendering, walking/jumping, block picking, placement checks and safe recovery.
Roadside structures include a climbable watchtower, a campsite, stone ruins and
a farmhouse with fields.

## Język / Language

The game starts in **English** by default. The **EN / PL** switch in the top
bar changes the whole interface instantly without reloading, so unsaved work is
kept. The choice is remembered in this browser (`localStorage` key
`minecraft-0.3-language`), separately from the world save. Add `?lang=pl` or
`?lang=en` to the address to override it for one visit without changing the
remembered choice. Proper names (Klocki Podlasia, Ekipa spod Lipy, village
names) stay Polish; materials, biomes and structures are translated. An
unnamed world is shown as Meadow / Łąka in the current language.

Gra domyślnie uruchamia się po angielsku. Przełącznik **EN / PL** na górnym
pasku zmienia język od razu, bez przeładowania i bez utraty niezapisanej pracy.

## Zapisywanie

Świat, ziarno, pozycja i kierunek gracza, materiał oraz ustawienia zapisują się
automatycznie co kilka sekund w IndexedDB. Przycisk **Zapisz** wymusza zapis
od razu; pasek u góry pokazuje jego rzeczywisty stan. Po ponownym otwarciu
wybierz świat z listy albo użyj **Kontynuuj**, aby wrócić do ostatnio używanego;
następnie wybierz sposób sterowania.

Po kliknięciu **Zapisz** komunikat pokazuje wynik operacji, nazwę świata,
miejsce zapisu (adres strony → IndexedDB → `minecraft-0.3` → `world-records` →
identyfikator świata) oraz szacowany rozmiar danych w MiB i bajtach. Szczegóły
pozostają w panelu pauzy; są też aktualizowane po autozapisie i wczytaniu.
Sukces jest pokazywany dopiero po zakończeniu transakcji. Błąd nie pokazuje
nowego rozmiaru. Świat jest rekordem IndexedDB, nie osobnym plikiem ani eksportem:
rozmiar obejmuje
tablice bloków i wody oraz metadane w JSON UTF-8, bez narzutu IndexedDB i
poprzedniej kopii.

Diagnostyka odróżnia adres rekordu w przeglądarce od lokalnej ścieżki na dysku.
Strona nie ma dostępu do fizycznej ścieżki plików IndexedDB, więc pokazuje ją
jako niedostępną, zamiast zgadywać. Folder profilu można sprawdzić ręcznie:
w Chrome otwórz `chrome://version` i odczytaj **Profile Path**, w Edge
`edge://version`, a w Firefox `about:profiles` (katalog główny profilu).
To folder profilu, nie ścieżka do osobnego pliku świata; układem plików bazy
zarządza przeglądarka.

Zapis jest lokalny dla profilu Chrome i adresu strony. Nie synchronizuje się
między urządzeniami ani między localhost a wersją hostowaną; wyczyszczenie lub
utrata danych przeglądarki może go usunąć. Poprzednia poprawna kopia może
odzyskać uszkodzony zapis po potwierdzeniu, ale nie jest zewnętrzną kopią
zapasową. Jeśli nie ma poprawnej kopii, uszkodzony zapis pozostaje chroniony;
zastąpienie go wymaga osobnego potwierdzenia utworzenia nowego świata. Gdy pamięć
jest niedostępna, świat pozostaje grywalny jako sesja tymczasowa, a gra wyraźnie
informuje, że zmiany nie są zapisane. Wykryty konflikt między kartami wymaga
wczytania aktualnej wersji, zamiast cichego nadpisania.

Na ekranie startowym możesz wybrać zapisany świat albo kontynuować ostatnio
używany. Każdy świat ma osobny zapis i kopię odzyskiwania. **Utwórz nowy
świat** pozwala wpisać nazwę (maksymalnie 32 znaki); nazwy nie muszą być
unikalne. Proponowana nazwa zawiera datę i godzinę utworzenia (`YYMMDD new
world HHMM`), jest edytowalna i dostaje kolejny numer, jeśli taka nazwa już
istnieje. Możesz zapisać maksymalnie 10 światów w profilu przeglądarki dla tego
adresu strony; usuń jeden, aby zrobić miejsce na kolejny. Utworzenie nie
zastępuje istniejącego świata. Możesz zmieniać nazwy światów albo je usuwać;
usunięcie wymaga potwierdzenia i obejmuje kopię
odzyskiwania. Gdy usuniesz ostatni świat, możesz utworzyć kolejny. Nie ma
przetrwania, craftingu, multiplayera, sterowania dotykowego, synchronizacji
chmurowej ani gwarancji działania offline/PWA. Więcej szczegółów i aktualne
bramki wydania zawiera [backlog](../backlog/voxel-sandbox-backlog.md).

From **Your worlds**, creating or deleting a world keeps the list open and
shows a confirmation. A newly created world is selected and focused; deleting
the selected world selects another available world without leaving the list.
Deleting the last world shows the empty state. Select a world or **Continue**
to choose a play mode. Creating a world from the pause menu still returns
directly to the play-mode controls. Conflicting world actions are disabled
during confirmations and pending operations; failures remain visible and
can be retried. If a change succeeds but refreshing the list fails, the message
asks you to reload instead of presenting the change as failed.

Przy pierwszym uruchomieniu wersja 0.3 może przenieść poprawne rekordy z dawnej
bazy `minecraft-0.4`, ale tylko jeśli katalog 0.3 jest pusty. Zachowuje też
informację o uszkodzonym zapisie, aby pokazać odzyskiwanie lub wymagać
potwierdzenia utworzenia nowego świata. Przy migracji starszych slotów 0.3
różne identyfikatory bieżącego i poprzedniego zapisu stają się osobnymi
światami; przy tym samym identyfikatorze poprzedni zapis zostaje kopią
odzyskiwania. Stara baza pozostaje nienaruszona. Jeśli migracja się nie
powiedzie, gra nie zapisuje tymczasowego świata automatycznie; pokaże ponowienie
migracji albo wymaga osobnego potwierdzenia utworzenia nowego świata.

## Kopie zapasowe / World backups

Na ekranie **Twoje światy** wybierz **Eksportuj** przy wybranym świecie.
W czasie gry użyj pauzy, a następnie **Wybierz świat**. Gra zapisze najnowsze
zmiany aktywnego świata przed eksportem; błąd zapisu zatrzyma eksport zamiast
pobrać starszą wersję. Przeglądarka pobierze plik `.minecraft-world.json`.
Zachowaj go poza danymi przeglądarki, np. na innym dysku. Komunikat potwierdza
zlecenie pobierania, nie faktyczne zapisanie pliku na dysku.

**Importuj świat** pozwala odtworzyć plik w tym samym lub innym profilu,
urządzeniu albo pod innym adresem strony. Import zawsze tworzy osobny świat
z nowym identyfikatorem i zachowuje nazwę; nigdy nie nadpisuje istniejącego.
Bieżący świat pozostaje wybrany. Po imporcie wybierz nową kopię z listy.
Anulowanie wyboru pliku niczego nie zmienia. Obowiązuje limit 10 światów;
eksport pozostaje dostępny przy pełnym katalogu.

From **Your worlds**, choose **Export** beside a world, or **Import world**
to restore a backup as a new copy. During play, pause and choose **Choose world**
first. Keep downloaded files somewhere safe: IndexedDB recovery copies still
are not external backups. Files stay local; there is no upload or cloud sync.

Backup format v1 is UTF-8 JSON with Base64 block/water data and SHA-256 integrity
checking over the canonical snapshot fields. It includes the seed, full terrain
and edits, water, player position/view, material and settings; it excludes
recovery generations and database revisions. Language stays a browser preference;
roaming creatures are recreated as on a normal load. Typical files are about
5.33 MiB, with an 8 MiB import limit checked before reading the file.
Only compatible Minecraft 0.3 schemas, generator versions and dimensions are
accepted. Corruption, incompatible versions, unavailable storage, and capacity
errors are reported without replacing existing worlds. SHA-256 detects accidental
damage, not who created the file. HTTPS or localhost with Web Crypto is required.
See the [design and verification plan](../backlog/minecraft-0.3-world-backups.md).

## Run

From the repository root, start the existing server:

```sh
./scripts/game-server.sh
```

Open <http://localhost:8765/klocki-podlasia-0.3/> or select version 0.3 in the
portfolio. Use HTTP: ES modules do not load by opening this HTML file directly.
No npm install, compilation, external font, CDN, account or network game server
is needed to play. Requires a desktop keyboard/mouse and WebGL2.

## Controls

- **Graj — przechwyć mysz**: capture the mouse after a click. Escape releases it
  and pauses. If capture is denied, retry or select **Graj bez przechwytywania**.
- In the alternate mode, drag across the world to look and use Q/E to edit.
- WASD / arrows: move; Space: jump; mouse: look.
- Left click / Q: remove; right click / E: place (click editing in captured mode).
- Choose a palette set: **Podstawowe**, **Budowlane**, **Ozdobne**, **Rudy i przyroda**, or **Meble**. Keys 1–8 select an item within the current set; the mouse wheel cycles through all 37 items and switches sets automatically. Palette swatches also select items. Reach is five blocks.
- On narrow screens the palette uses compact icons; hover an icon to see its
  name. The icons also retain accessible labels.
- P / Escape: pause; H / **Menu gier**: return to the portfolio.
- F / **Full screen**: toggle browser fullscreen.
- Follow the roads to the villages and roadside structures. The HUD shows your
  biome and X/Z coordinates; the pause panel lists destinations. Jump up the watchtower steps.
- **Wróć na start**: find a safe supported position without resetting the world.
- **Nowa łąka**: choose a name (up to 32 characters) and confirm creating a
  world with a different seed; existing worlds remain unchanged.
- Fullscreen and lower resolution are optional; denied fullscreen leaves windowed play.
- **Music / Soundtrack / Music volume**: select a random track (the default), a
  named track, or the original generated music, and adjust the volume in the
  start/pause panel. Random mode picks another track when one ends; a named track
  repeats. Playback pauses with the game and resumes at the same position.
  The on/off setting and volume are saved with the world; the soundtrack choice
  lasts for the current page session only. If the catalogue cannot be loaded
  or contains no tracks, the original music is selected and a message is shown.

**Navigation exception:** unlike the 2D games, Escape pauses instead of returning
to the portfolio because browsers use it to release pointer lock. H still goes home.
Switching apps/tabs pauses and clears held movement; resuming is always explicit.

## Building Materials

All 37 materials and furniture pieces have original procedural pixel textures, including bark and end grain on logs, birch bark and cherry leaves, grass-topped soil, masonry, planks, stone, metal and mineral-bearing ores. Palette swatches show the same textures. Ore veins are generated deterministically below the surface and can be mined or placed like other blocks. The original three villages are connected by roads to four earlier settlements: Brzozowa (112, 56), Ceglane Wzgórze (196, 80), Kamienny Gród (100, 168) and Turkusowa Łąka (196, 192). Each has its own building palette, houses, a well and a distinctive landmark. Residents wander inside their homes, three iron golems patrol the original roads, and pigs, cows, sheep, chickens, foxes and rabbits roam nearby.

Every house has a two-piece bed, a table, a bookshelf, a chest and a stove.
These are decorative, editable building pieces; beds do not set a spawn or
advance time, and chests and stoves do not store or craft items.

Beyond the original meadow are ten more biomes: desert, savanna, tundra,
taiga, jungle, badlands, birch forest, swamp, mountains and cherry grove.
Each has a village with a resident, homes and a well. Village locations are
listed in the pause menu and connected to the existing road network.

Animals, residents and golems also use original pixel-textured models, with distinctive coats, clothing and iron details. Their legs and, where applicable, arms animate while walking.

Only nearby chunks are rendered. Leaving an area unloads its meshes, not its
blocks; edits are also retained in the saved world.

The watchtower (82, 44), campsite (151, 67), stone ruins (100, 112) and
farmhouse (154, 180) have paths leading from the main roads. The campsite
fire and farm crops are decorative blocks, not interactive mechanics.

Three shallow lakes and two crossing streams have sandy bottoms and animated
water. The streams reach opposite edges of the world and pass under road bridges.
You can wade and jump through them and place blocks in the water; removing a
block restores the water in that cell. Water is decorative and does not flow or
spread.

## Development and verification

On macOS, install the optional browser-testing tools with:

```sh
./scripts/bootstrap-browser-tests.sh
```

The script checks Node.js 20+, npm and Python 3.9+ (including its HTTP/TLS
standard library), reuses working tools, and installs missing runtimes with
Homebrew on macOS. Broken Homebrew-managed runtimes are upgraded or reinstalled
once; other installations are not overwritten. If another installation shadows
Homebrew, repair it or adjust `PATH` manually. Homebrew must already be installed.
Playwright and Chromium use local caches, not the game's dependencies. A
temporary headless screenshot verifies that Chromium launches; broken browser
files get one forced reinstall attempt.

Output and help are coloured in a terminal; `NO_COLOR=1`, `TERM=dumb` and
redirected output disable colours. The script prints its version, Git branch,
commit and worktree status (including untracked files). To check runtimes and
cached Playwright/Chromium without installing or downloading, enable extra
diagnostics, or show full help:

```sh
./scripts/bootstrap-browser-tests.sh --check
./scripts/bootstrap-browser-tests.sh --check --debug
./scripts/bootstrap-browser-tests.sh --help
```

An `ENOTCACHED` result during the offline check means npm could not find
Playwright in its cache; normal setup then attempts to install it. In `--check`
mode this is an error and nothing is installed. Other browser errors are shown;
`--debug` also prints the full offline-check error output. Debug output may
contain local paths or details from npm, so review it before sharing.

On macOS, the script uses `/etc/ssl/cert.pem` as additional Node.js certificate
authorities when the file is available and `NODE_EXTRA_CA_CERTS` is not set.
This only affects the script and its child processes. If npm still reports a TLS
error, explicitly configure the trusted certificate required by your network:

```sh
NODE_EXTRA_CA_CERTS=/absolute/path/to/trusted-ca.pem ./scripts/bootstrap-browser-tests.sh
```

The script respects existing npm proxy/CA settings and never disables TLS
verification or rewrites npm configuration. Playwright Chromium checks do not
replace release checks in standalone Google Chrome.

Run the game logic tests with:

```sh
env ATOM_LOCK_SKIP_NATIVE_AUDIO=1 ATOM_LOCK_SKIP_NATIVE_UI=1 \
  node --test klocki-podlasia-0.3/tests/*.test.js
```

Pure tests cover generation, exposed faces, cross-chunk edits, picking, player
collision/movement and save validation. Browser checks should include save/reload,
recovery from a damaged save, new-world confirmation, editing, pause/resume and
conflict detection.

The current local reference run used Chrome 157.0.8103.78 on macOS 27.2, Apple M3,
16 GiB RAM. In headless Chrome, 20 full application saves measured a 23.2 ms
median and 33.6 ms p95; 20 validated restores measured 25.9 ms median and 42.9 ms
p95. No long tasks were observed in that save run. These local headless results
are not hosted-load or frame-rate benchmarks. Native pointer capture was also
verified in standalone Chrome 157 on this Mac in an Incognito session; Escape
released it and returned to pause. Denied-pointer-lock recovery and hosted
loading remain unverified. Safari, Firefox, Windows and mobile are not release
claims.

The pause panel's diagnostics show the world dimensions and seed, render-buffer
resolution and pixel ratio, frames, draw calls, live geometries, first-render
time and frame-time median/p95. Save details, including the saved world name,
time, browser storage location, recovery-copy availability, storage persistence
and estimated data size, are in the same section. The recovery copy is stored in
the same browser profile, not as an independent backup. Persistent storage can
still be cleared manually; non-persistent site data may be evicted by the browser.

With the repository game server, this section also shows the current checkout's
branch, clean/modified working tree (including untracked files), full commit hash,
relative commit age and timestamp, and page age. Commit age is not a build date:
uncommitted edits are reported separately, and the checkout can change after the
page loads. Reload the page to load updated game code.

Server health includes request counts, HTTP errors (4xx/5xx), handler exceptions,
and the latest error since this server process started. Browser diagnostics count
uncaught errors, rejected promises, failed resource loads, and WebGL context loss
observed on this page; this is not a guarantee that every game subsystem is healthy.
**Show recent server logs** reveals up to 200 lines / 64 KiB from the current log
file, which may include entries from before the latest server restart. Logs stay
hidden until requested. **Refresh diagnostics** retries failed checks; checks and
visible logs refresh every 15 seconds while diagnostics are open in a visible tab.
Git metadata and logs are read-only, local same-origin endpoints with no caching
or cross-origin access. Hosted sites and plain static servers explicitly report
these diagnostics as unavailable. If an older repository server is already
running, apply the server update with `python3 scripts/game-server.py restart`.

The original melodic instrumental
soundtrack is generated locally with Web Audio, with soft keys, bass and
sustained harmonies. It does not contain Minecraft music or require downloads.
MP3, WAV, OGG and M4A files are shared through the repository's `music/` directory. After adding
or removing tracks, run `python3 scripts/generate-music-catalogue.py` from the
repository root and refresh the game. Commit both the audio file changes and the
generated `music/catalogue.json` to publish them on the existing static site.
Format and codec support varies by browser; an unplayable track reports an error.
Only publish music you have permission to distribute; files on the site are public.

## Dependency

Three.js **0.180.0 / r180**, MIT, vendored from the published npm package via
`https://cdn.jsdelivr.net/npm/three@0.180.0/`:

- `build/three.module.js`
- `build/three.core.js` (required transitive module)
- `examples/jsm/controls/PointerLockControls.js`
- `LICENSE`, preserved as [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)

The local import map maps `three` to the vendored module. Do not mix versions
of these files. All game art is original; no Minecraft game assets are used.
