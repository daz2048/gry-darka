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
świat wraca do ekranu pauzy — wybierz sposób sterowania, aby wznowić.

Po kliknięciu **Zapisz** komunikat pokazuje wynik operacji, nazwę świata,
miejsce zapisu (adres strony → IndexedDB → `minecraft-0.3` → `worlds` →
`current`) oraz szacowany rozmiar danych w MiB i bajtach. Szczegóły pozostają
w panelu pauzy; są też aktualizowane po autozapisie i wczytaniu. Sukces jest
pokazywany dopiero po zakończeniu transakcji. Błąd nie pokazuje nowego rozmiaru.
To nie jest plik na dysku ani eksport: rozmiar obejmuje tablice bloków i wody
oraz metadane w JSON UTF-8, bez narzutu IndexedDB i poprzedniej kopii.

Zapis jest lokalny dla profilu Chrome i adresu strony. Nie synchronizuje się
między urządzeniami ani między localhost a wersją hostowaną; wyczyszczenie lub
utrata danych przeglądarki może go usunąć. Poprzednia poprawna kopia może
odzyskać uszkodzony zapis po potwierdzeniu, ale nie jest zewnętrzną kopią
zapasową. Jeśli nie ma poprawnej kopii, uszkodzony zapis pozostaje chroniony;
zastąpienie go wymaga osobnego potwierdzenia utworzenia nowego świata. Gdy pamięć
jest niedostępna, świat pozostaje grywalny jako sesja tymczasowa, a gra wyraźnie
informuje, że zmiany nie są zapisane. Wykryty konflikt między kartami wymaga
wczytania aktualnej wersji, zamiast cichego nadpisania.

To jeden lokalny slot. Przy tworzeniu **nowej łąki** możesz wpisać jej nazwę
(maksymalnie 32 znaki); nazwa jest zapisywana i wyświetlana w świecie.
Utworzenie wymaga potwierdzenia; anulowanie niczego nie zmienia, a poprzedni
zapis zostaje zachowany jako kopia odzyskiwania. Nie ma
przetrwania, craftingu, multiplayera, sterowania dotykowego, synchronizacji
chmurowej ani gwarancji działania offline/PWA. Więcej szczegółów i aktualne
bramki wydania zawiera [backlog](../backlog/voxel-sandbox-backlog.md).

Przy pierwszym uruchomieniu wersja 0.3 może przenieść poprawne rekordy z dawnej
bazy `minecraft-0.4`, ale tylko jeśli slot 0.3 jest pusty. Zachowuje też
informację o uszkodzonym zapisie, aby pokazać odzyskiwanie lub wymagać
potwierdzenia zastąpienia. Stara baza pozostaje nienaruszona jako kopia. Jeśli
migracja się nie powiedzie, gra nie zapisuje tymczasowego świata automatycznie;
pokaże ponowienie migracji albo wymaga osobnego potwierdzenia utworzenia nowego
świata.

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
- Follow the roads to the villages and roadside structures. The HUD shows your
  biome and X/Z coordinates; the pause panel lists destinations. Jump up the watchtower steps.
- **Wróć na start**: find a safe supported position without resetting the world.
- **Nowa łąka**: choose a name (up to 32 characters) and confirm replacement
  with a different seed; the previous world remains the recovery copy.
- Fullscreen and lower resolution are optional; denied fullscreen leaves windowed play.
- **Muzyka / Głośność muzyki**: enable or mute the original ambient music and
  adjust its volume in the start/pause panel. It begins after choosing a play mode
  and stops when the game is paused or loses focus. Its setting and volume are saved.

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

The pause panel's diagnostics show the seed, frames, draw calls, live geometries,
first-render time and frame-time median/p95. The original melodic instrumental
soundtrack is generated locally with Web Audio, with soft keys, bass and
sustained harmonies. It does not contain Minecraft music or require downloads.

## Dependency

Three.js **0.180.0 / r180**, MIT, vendored from the published npm package via
`https://cdn.jsdelivr.net/npm/three@0.180.0/`:

- `build/three.module.js`
- `build/three.core.js` (required transitive module)
- `examples/jsm/controls/PointerLockControls.js`
- `LICENSE`, preserved as [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)

The local import map maps `three` to the vendored module. Do not mix versions
of these files. All game art is original; no Minecraft game assets are used.
