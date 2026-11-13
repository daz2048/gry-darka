export const LANGUAGES = ['en', 'pl'];
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'minecraft-0.3-language';
const LOCALES = { en: 'en-GB', pl: 'pl-PL' };

export const MESSAGES = {
  en: {
    'meta.title': 'Minecraft 0.3 — creative building with Ekipa spod Lipy',
    'language.group': 'Language',
    'viewport.label': '3D block world',
    'brand.mode': 'VERSION 0.3 · CREATIVE MODE',
    'status.loading': 'Loading save…',
    'button.save': 'Save',
    'button.reloadSave': 'Load the current save',
    'button.retryMigration': 'Retry save migration',
    'button.pause': 'Pause · P',
    'link.menuHotkey': 'Games menu · H',
    'link.menu': 'Games menu',
    'worldLabel.eyebrow': 'YOUR WORLD',
    'world.nameLabel': 'World name (max. 32 characters)',
    'world.defaultName': 'Meadow',
    'world.newDefault': 'New world',
    'world.nameRequired': 'Enter a world name.',
    'details.saving': 'Saving…\nLocation: {location}',
    'details.labelSaved': 'Save completed successfully.',
    'details.labelLoaded': 'Last valid save.',
    'details.saved': '{label} World: {name}. Saved {time}.\nLocation: {location} (this browser profile).\nEstimated data size: {size} MiB ({bytes} B).\nThis is a browser save, not a downloadable file. The size excludes database overhead and the previous copy.',
    'details.pending': 'Newer changes are waiting for the next save.',
    'details.error': 'Save failed: {error}\nAttempted location: {location}\nNo new save was confirmed. The size of the unsaved record is not available.',
    'notice.saveFailed': 'Save failed: {error}',
    'worldLabel.title': 'Big world. Big ideas.',
    'hud.label': 'Materials and game status',
    'target.idle': 'Pick a material and build something of your own.',
    'target.block': '{block} · Q remove / E place {selected}',
    'target.far': 'Move closer — building reach: 5 blocks.',
    'palette.group': 'Material sets',
    'palette.picker': 'Material picker',
    'palette.basic': 'Basic',
    'palette.basicShort': 'Basic',
    'palette.building': 'Building',
    'palette.buildingShort': 'Build',
    'palette.decor': 'Decorative',
    'palette.decorShort': 'Decor',
    'palette.nature': 'Ores and nature',
    'palette.natureShort': 'Ores+',
    'palette.furniture': 'Furniture',
    'palette.furnitureShort': 'Furn.',
    'hint.initial': 'WASD · move \u00a0 Space · jump \u00a0 1–8 · blocks \u00a0 Q / E · remove / place',
    'hint.drag': 'Drag the mouse · look | WASD · move | Space · jump | Q / E · remove / place | P · pause',
    'hint.pointer': 'WASD · move | Space · jump | LMB / Q · remove | RMB / E · place | Esc · pause',
    'session.local': 'Saved locally in this Chrome profile. This is not a backup.',
    'session.temporary': 'This temporary session does not save changes; the old save is protected.',
    'session.migration': 'The previous world is kept. Retry the migration or confirm a new world.',
    'session.unconfirmed': 'Saving could not be confirmed; changes may disappear when you close the page.',
    'overlay.eyebrow': 'EKIPA SPOD LIPY · VERSION 0.3',
    'overlay.intro': 'The house under the linden tree is just the beginning. Wander the meadow, take blocks apart and build your own way.',
    'instructions.move': '<b>WASD / arrows</b> move · <b>Space</b> jump · mouse turns the view',
    'instructions.edit': '<b>LMB / Q</b> remove · <b>RMB / E</b> place · <b>1–8</b> material from the set · <b>wheel</b> all materials',
    'instructions.pause': '<b>Esc / P</b> pause and release the mouse · <b>H</b> games menu',
    'overlay.saveInfo': 'The world is saved locally in this Chrome profile. The top bar shows the save status; a storage failure does not stop the game, but leaves the session unsaved.',
    'overlay.dragInfo': 'No-capture mode: drag across the world to look around; Q / E change blocks. Keyboard computers only.',
    'overlay.scope': 'Desktop version: no survival, crafting, multiplayer or touch controls.',
    'ideas.summary': 'Building ideas (optional)',
    'ideas.text': 'Build a house under the linden tree, connect the riverbanks with a bridge or plant a garden. These are only ideas — no tasks or limits.',
    'places.summary': 'Biomes, villages and roads',
    'places.text': 'Follow the roads. The biome and player coordinates are shown above the material bar.',
    'settings.sensitivity': 'Mouse sensitivity',
    'settings.lowQuality': 'Lower resolution',
    'settings.music': 'Music',
    'settings.volume': 'Music volume',
    'button.start': 'Play — capture mouse',
    'button.dragStart': 'Play without capturing',
    'button.recover': 'Back to start',
    'button.newWorld': 'New meadow',
    'button.fullscreen': 'Full screen',
    'button.restoreBackup': 'Restore the previous save',
    'button.confirmReset': 'Yes, new meadow',
    'button.cancelReset': 'No, keep my build',
    'button.stay': 'Stay and try again',
    'button.leave': 'Leave without saving',
    'recovery.label': 'Save recovery',
    'recovery.current': 'The current save is damaged. We loaded the previous copy; confirm restoring it before you continue.',
    'recovery.migrated': 'The previous save was moved. The current data is damaged; confirm restoring the previous copy before you continue.',
    'reset.label': 'Confirm new meadow',
    'reset.normal': 'The current world will be kept as the previous save and a new meadow will replace it. Continue?',
    'reset.recovery': 'The damaged current save will be replaced; the restored copy stays kept. Continue?',
    'reset.corrupt': 'The previous world cannot be restored. Confirm to replace the damaged save with a new world.',
    'reset.migration': 'The previous world cannot be moved. Its database stays kept. Confirm to start a new world.',
    'leave.label': 'Unsaved changes',
    'leave.text': 'Saving failed. If you leave now, changes since the last save will be lost.',
    'metrics.summary': 'Model diagnostics',
    'metrics.waiting': 'Waiting for the renderer.',
    'metrics.text': 'Three.js r{revision} · WebGL2\nWorld: {size} · seed: {seed}\nFPS: {fps} · draw calls: {calls} · geometries: {geometries}\nFirst frame (local): {first} ms\nGame samples: {samples} · median: {median} ms · p95: {p95} ms\nEdits: {edits} · position: {position}',
    'save.saved': 'Saved {time}',
    'save.saving': 'Saving…',
    'save.dirty': 'Unsaved changes',
    'save.dirtyBlocked': 'Changes not saved — choose recovery or a new world.',
    'save.conflict': 'Save conflict — load the current version.',
    'save.failed': 'Not saved — try again.',
    'save.recoveryPending': 'Copy restored — confirm saving.',
    'save.corrupt': 'Damaged save — we will not overwrite it.',
    'save.newWorld': 'New world — saving…',
    'save.migrationFailed': 'The save could not be moved — the old copy is kept.',
    'save.loadFailed': 'The save could not be loaded — temporary session.',
    'load.preparing': 'Preparing the meadow…',
    'load.loading': 'Loading the world and save…',
    'load.ready': 'Saved world ready. Choose how to play.',
    'load.migrated': 'The previous save was moved safely. Choose how to play.',
    'load.recoveredPosition': 'Your position was blocked. We found a safe place; save to keep it for next time.',
    'load.recoveryReady': 'The previous copy is ready to restore.',
    'load.corrupt': 'The save is damaged. You can play this session without saving, or confirm to create a new world.',
    'load.newWorld': 'New meadow ready. Saving the first checkpoint.',
    'load.newSaved': 'New meadow saved. Choose how to play.',
    'load.newFailed': 'The new meadow could not be saved safely. The previous world is still active.',
    'load.restored': 'Previous save restored. Choose how to play.',
    'load.migrationFailed': 'The previous save could not be moved. You can try again or confirm starting a new world.',
    'load.saveUnavailable': 'The game runs without saving. Check browser storage access and try again.',
    'load.allowPrompt': 'Click “Allow” if the browser asks to capture the mouse.',
    'load.lockUnavailable': 'Mouse capture is unavailable. Choose the no-capture mode.',
    'load.lockFailed': 'The mouse could not be captured. Choose the no-capture mode.',
    'load.lockDenied': 'The browser refused mouse capture. Try again or choose the no-capture mode.',
    'load.webglLost': 'WebGL was lost. Check the save status before reloading the page.',
    'pause.heading': 'A moment under the linden tree',
    'pause.intro': 'Your build is waiting. Resume your walk or return safely to the start.',
    'notice.tooFar': 'Move closer to a block (reach: 5).',
    'notice.noSafeSpot': 'No safe place found. Remove obstacles or create a new meadow.',
    'notice.safe': 'You are in a safe place. The world is unchanged.',
    'notice.noFullscreen': 'This browser does not support full screen. Play in the window.',
    'notice.fullscreenFailed': 'Full screen is unavailable. The game keeps running in the window.',
    'music.failed': 'The music could not start. Play without it or try again.',
    'music.stopped': 'The music stopped because of an error. The game continues.',
    'edit.boundary': 'The world boundary cannot be changed.',
    'edit.unknown': 'Unknown material.',
    'edit.occupied': 'This spot is already taken.',
    'edit.empty': 'There is no block here.',
    'edit.player': 'Step aside: the player is standing here.',
    'error.conflict': 'The save changed in another tab. Load the latest version before saving.',
    'error.corrupt': 'The world save is damaged or incompatible with this version.',
    'error.migration': 'The previous save could not be moved. Its database was not changed; reload the page to try again.',
    'error.storage-unavailable': 'Browser storage is unavailable, so the world cannot be saved.',
    'error.storage-busy': 'The save is busy in another tab. Close the other tab and try again.',
    'error.save-failed': 'The world could not be saved. Try again.',
    'error.quota': 'Browser storage is full. Free some space and try again.',
    'error.save-loading': 'The save is still loading.',
    'error.save-blocked': 'Resolve the problem with the previous save first.',
    'error.unexpected': 'Something went wrong. Details are in the browser console.',
    biomes: {
      meadow: 'Meadow', desert: 'Desert', savanna: 'Savanna', tundra: 'Tundra', taiga: 'Taiga',
      jungle: 'Jungle', badlands: 'Badlands', birch: 'Birch forest', swamp: 'Swamp',
      mountains: 'Mountains', cherry: 'Cherry grove'
    },
    structures: ['Watchtower', 'Camp', 'Stone ruins', 'Farmstead'],
    blocks: ['Air', 'Grass', 'Dirt', 'Stone', 'Log', 'Leaves', 'Sand', 'Planks', 'Roof tile', 'Brick',
      'Light brick', 'Cobblestone', 'Marble', 'Granite', 'Basalt', 'Concrete', 'Dark planks', 'White planks',
      'Moss', 'Snow', 'Copper', 'Steel', 'Gold', 'Coral', 'Turquoise', 'Coal ore', 'Iron ore', 'Copper ore',
      'Gold ore', 'Diamond ore', 'Birch log', 'Cherry leaves', 'Bed — blanket', 'Bed — pillow', 'Table',
      'Bookshelf', 'Chest', 'Furnace']
  },
  pl: {
    'meta.title': 'Minecraft 0.3 — kreatywne budowanie Ekipy spod Lipy',
    'language.group': 'Język',
    'viewport.label': 'Trójwymiarowy świat klocków',
    'brand.mode': 'WERSJA 0.3 · TRYB KREATYWNY',
    'status.loading': 'Ładowanie zapisu…',
    'button.save': 'Zapisz',
    'button.reloadSave': 'Wczytaj aktualny zapis',
    'button.retryMigration': 'Ponów migrację zapisu',
    'button.pause': 'Pauza · P',
    'link.menuHotkey': 'Menu gier · H',
    'link.menu': 'Menu gier',
    'worldLabel.eyebrow': 'TWÓJ ŚWIAT',
    'world.nameLabel': 'Nazwa świata (maks. 32 znaki)',
    'world.defaultName': 'Łąka',
    'world.newDefault': 'Nowy świat',
    'world.nameRequired': 'Wpisz nazwę świata.',
    'details.saving': 'Zapisywanie…\nMiejsce: {location}',
    'details.labelSaved': 'Zapis zakończony pomyślnie.',
    'details.labelLoaded': 'Ostatni poprawny zapis.',
    'details.saved': '{label} Świat: {name}. Zapisano {time}.\nMiejsce: {location} (ten profil przeglądarki).\nSzacowany rozmiar danych: {size} MiB ({bytes} B).\nTo zapis w przeglądarce, nie plik do pobrania. Rozmiar nie obejmuje narzutu bazy ani poprzedniej kopii.',
    'details.pending': 'Nowsze zmiany czekają na kolejny zapis.',
    'details.error': 'Zapis nie powiódł się: {error}\nMiejsce próby: {location}\nNie potwierdzono nowego zapisu. Rozmiar niezapisanego rekordu nie jest dostępny.',
    'notice.saveFailed': 'Zapis nie powiódł się: {error}',
    'worldLabel.title': 'Wielki świat. Wielkie pomysły.',
    'hud.label': 'Materiały i stan gry',
    'target.idle': 'Wybierz materiał i zbuduj coś swojego.',
    'target.block': '{block} · Q usuń / E dodaj {selected}',
    'target.far': 'Podejdź bliżej — zasięg budowania: 5 klocków.',
    'palette.group': 'Zestawy materiałów',
    'palette.picker': 'Wybór materiału',
    'palette.basic': 'Podstawowe',
    'palette.basicShort': 'Podst.',
    'palette.building': 'Budowlane',
    'palette.buildingShort': 'Bud.',
    'palette.decor': 'Ozdobne',
    'palette.decorShort': 'Ozd.',
    'palette.nature': 'Rudy i przyroda',
    'palette.natureShort': 'Rudy+',
    'palette.furniture': 'Meble',
    'palette.furnitureShort': 'Meble',
    'hint.initial': 'WASD · ruch \u00a0 Spacja · skok \u00a0 1–8 · klocki \u00a0 Q / E · usuń / dodaj',
    'hint.drag': 'Przeciągaj myszą · widok | WASD · ruch | Spacja · skok | Q / E · usuń / dodaj | P · pauza',
    'hint.pointer': 'WASD · ruch | Spacja · skok | LPM / Q · usuń | PPM / E · dodaj | Esc · pauza',
    'session.local': 'Zapis lokalny w tym profilu Chrome. To nie jest kopia zapasowa.',
    'session.temporary': 'Ta tymczasowa sesja nie zapisuje zmian; stary zapis jest chroniony.',
    'session.migration': 'Poprzedni świat jest zachowany. Ponów migrację albo potwierdź utworzenie nowego świata.',
    'session.unconfirmed': 'Nie można potwierdzić zapisu; zmiany mogą zniknąć po zamknięciu.',
    'overlay.eyebrow': 'EKIPA SPOD LIPY · WERSJA 0.3',
    'overlay.intro': 'Domek pod lipą to dopiero początek. Spaceruj po łące, rozbieraj klocki i buduj po swojemu.',
    'instructions.move': '<b>WASD / strzałki</b> ruch · <b>Spacja</b> skok · mysz obraca widok',
    'instructions.edit': '<b>LPM / Q</b> usuń · <b>PPM / E</b> dodaj · <b>1–8</b> materiał z zestawu · <b>rolka</b> wszystkie materiały',
    'instructions.pause': '<b>Esc / P</b> pauza i uwolnienie myszy · <b>H</b> menu gier',
    'overlay.saveInfo': 'Świat zapisuje się lokalnie w tym profilu Chrome. Pasek u góry pokazuje stan zapisu; awaria pamięci nie blokuje gry, ale pozostawia sesję bez zapisu.',
    'overlay.dragInfo': 'Tryb bez przechwytywania: przeciągaj po świecie, aby się rozglądać; Q / E zmieniają klocki. Tylko komputer z klawiaturą.',
    'overlay.scope': 'Wersja desktopowa: bez przetrwania, craftingu, multiplayera i sterowania dotykowego.',
    'ideas.summary': 'Pomysły na budowę (opcjonalne)',
    'ideas.text': 'Zbuduj domek pod lipą, połącz brzegi mostem albo załóż ogródek. To tylko inspiracje — bez zadań i ograniczeń.',
    'places.summary': 'Biomy, wioski i drogi',
    'places.text': 'Podążaj drogami. Biom i współrzędne gracza widać nad paskiem materiałów.',
    'settings.sensitivity': 'Czułość myszy',
    'settings.lowQuality': 'Niższa rozdzielczość',
    'settings.music': 'Muzyka',
    'settings.volume': 'Głośność muzyki',
    'button.start': 'Graj — przechwyć mysz',
    'button.dragStart': 'Graj bez przechwytywania',
    'button.recover': 'Wróć na start',
    'button.newWorld': 'Nowa łąka',
    'button.fullscreen': 'Pełny ekran',
    'button.restoreBackup': 'Odzyskaj poprzedni zapis',
    'button.confirmReset': 'Tak, nowa łąka',
    'button.cancelReset': 'Nie, zachowaj budowlę',
    'button.stay': 'Zostań i spróbuj ponownie',
    'button.leave': 'Wyjdź bez zapisu',
    'recovery.label': 'Odzyskiwanie zapisu',
    'recovery.current': 'Bieżący zapis jest uszkodzony. Wczytaliśmy poprzednią kopię; potwierdź jej odzyskanie przed dalszą grą.',
    'recovery.migrated': 'Poprzedni zapis został przeniesiony. Bieżące dane są uszkodzone; potwierdź odzyskanie poprzedniej kopii przed dalszą grą.',
    'reset.label': 'Potwierdzenie nowej łąki',
    'reset.normal': 'Bieżący świat zostanie zachowany jako poprzedni zapis, a nowa łąka zastąpi bieżącą. Kontynuować?',
    'reset.recovery': 'Uszkodzony bieżący zapis zostanie zastąpiony; odzyskana kopia pozostanie zachowana. Kontynuować?',
    'reset.corrupt': 'Nie można odzyskać poprzedniego świata. Potwierdź, aby zastąpić uszkodzony zapis nowym światem.',
    'reset.migration': 'Nie można przenieść poprzedniego świata. Jego baza pozostanie zachowana. Potwierdź, aby rozpocząć nowy świat.',
    'leave.label': 'Niezapisane zmiany',
    'leave.text': 'Nie udało się zapisać. Jeśli wyjdziesz teraz, zmiany od ostatniego zapisu zostaną utracone.',
    'metrics.summary': 'Diagnostyka modelu',
    'metrics.waiting': 'Oczekiwanie na renderer.',
    'metrics.text': 'Three.js r{revision} · WebGL2\nŚwiat: {size} · seed: {seed}\nFPS: {fps} · draw calls: {calls} · geometrie: {geometries}\nPierwsza klatka (lokalnie): {first} ms\nPróbki gry: {samples} · mediana: {median} ms · p95: {p95} ms\nEdycje: {edits} · pozycja: {position}',
    'save.saved': 'Zapisano {time}',
    'save.saving': 'Zapisywanie…',
    'save.dirty': 'Niezapisane zmiany',
    'save.dirtyBlocked': 'Zmiany nie zapisane — wybierz odzyskiwanie lub nowy świat.',
    'save.conflict': 'Konflikt zapisu — wczytaj aktualną wersję.',
    'save.failed': 'Nie zapisano — ponów próbę.',
    'save.recoveryPending': 'Odzyskano kopię — potwierdź zapis.',
    'save.corrupt': 'Uszkodzony zapis — nie nadpisujemy go.',
    'save.newWorld': 'Nowy świat — zapisujemy…',
    'save.migrationFailed': 'Nie można przenieść zapisu — stara kopia jest zachowana.',
    'save.loadFailed': 'Nie można wczytać zapisu — sesja tymczasowa.',
    'load.preparing': 'Przygotowujemy łąkę…',
    'load.loading': 'Wczytujemy świat i zapis…',
    'load.ready': 'Zapisany świat gotowy. Wybierz sposób sterowania.',
    'load.migrated': 'Poprzedni zapis został bezpiecznie przeniesiony. Wybierz sposób sterowania.',
    'load.recoveredPosition': 'Pozycja była zablokowana. Znaleźliśmy bezpieczne miejsce; zapisz, aby zachować ją na przyszłość.',
    'load.recoveryReady': 'Poprzednia kopia jest gotowa do odzyskania.',
    'load.corrupt': 'Zapis jest uszkodzony. Możesz zagrać w tej sesji bez zapisu albo po potwierdzeniu utworzyć nowy świat.',
    'load.newWorld': 'Nowa łąka gotowa. Zapisujemy pierwszy punkt kontrolny.',
    'load.newSaved': 'Nowa łąka zapisana. Wybierz sposób sterowania.',
    'load.newFailed': 'Nie udało się bezpiecznie zapisać nowej łąki. Poprzedni świat pozostał aktywny.',
    'load.restored': 'Poprzedni zapis odzyskany. Wybierz sposób sterowania.',
    'load.migrationFailed': 'Nie udało się przenieść poprzedniego zapisu. Możesz ponowić próbę lub potwierdzić rozpoczęcie nowego świata.',
    'load.saveUnavailable': 'Gra działa bez zapisu. Sprawdź dostęp do pamięci przeglądarki i spróbuj ponownie.',
    'load.allowPrompt': 'Kliknij „Zezwól”, jeśli przeglądarka pyta o przechwycenie myszy.',
    'load.lockUnavailable': 'Przechwytywanie myszy niedostępne. Wybierz tryb bez przechwytywania.',
    'load.lockFailed': 'Nie można przechwycić myszy. Wybierz tryb bez przechwytywania.',
    'load.lockDenied': 'Przeglądarka odmówiła przechwycenia. Spróbuj ponownie lub wybierz tryb bez przechwytywania.',
    'load.webglLost': 'Utracono WebGL. Sprawdź stan zapisu przed odświeżeniem strony.',
    'pause.heading': 'Chwila pod lipą',
    'pause.intro': 'Twoja budowla czeka. Wznów spacer lub wróć bezpiecznie na start.',
    'notice.tooFar': 'Podejdź bliżej klocka (zasięg: 5).',
    'notice.noSafeSpot': 'Brak bezpiecznego miejsca. Usuń przeszkody lub utwórz nową łąkę.',
    'notice.safe': 'Jesteś w bezpiecznym miejscu. Świat pozostał bez zmian.',
    'notice.noFullscreen': 'Ta przeglądarka nie udostępnia pełnego ekranu. Graj w oknie.',
    'notice.fullscreenFailed': 'Pełny ekran niedostępny. Gra nadal działa w oknie.',
    'music.failed': 'Nie można uruchomić muzyki. Graj bez niej lub spróbuj ponownie.',
    'music.stopped': 'Muzyka została zatrzymana z powodu błędu. Gra działa dalej.',
    'edit.boundary': 'Nie można zmienić granicy świata.',
    'edit.unknown': 'Nieznany materiał.',
    'edit.occupied': 'To miejsce jest już zajęte.',
    'edit.empty': 'Nie ma tu klocka.',
    'edit.player': 'Odsuń się: tutaj stoi gracz.',
    'error.conflict': 'Zapis zmienił się w innej karcie. Wczytaj najnowszą wersję przed zapisem.',
    'error.corrupt': 'Zapis świata jest uszkodzony lub niezgodny z tą wersją.',
    'error.migration': 'Nie można przenieść poprzedniego zapisu. Jego baza nie została zmieniona; odśwież stronę, aby spróbować ponownie.',
    'error.storage-unavailable': 'Pamięć przeglądarki jest niedostępna, więc świat nie może zostać zapisany.',
    'error.storage-busy': 'Zapis jest zajęty przez inną kartę. Zamknij ją i spróbuj ponownie.',
    'error.save-failed': 'Nie można zapisać świata. Spróbuj ponownie.',
    'error.quota': 'Pamięć przeglądarki jest pełna. Zwolnij miejsce i spróbuj ponownie.',
    'error.save-loading': 'Zapis jest jeszcze wczytywany.',
    'error.save-blocked': 'Najpierw rozwiąż problem z poprzednim zapisem.',
    'error.unexpected': 'Coś poszło nie tak. Szczegóły są w konsoli przeglądarki.',
    biomes: {
      meadow: 'Łąka', desert: 'Pustynia', savanna: 'Sawanna', tundra: 'Tundra', taiga: 'Tajga',
      jungle: 'Dżungla', badlands: 'Pustkowia', birch: 'Las brzozowy', swamp: 'Bagna',
      mountains: 'Góry', cherry: 'Wiśniowy gaj'
    },
    structures: ['Wieża obserwacyjna', 'Obozowisko', 'Kamienne ruiny', 'Gospodarstwo'],
    blocks: ['Powietrze', 'Trawa', 'Ziemia', 'Kamień', 'Pień', 'Liście', 'Piasek', 'Deski', 'Dachówka', 'Cegła',
      'Jasna cegła', 'Bruk', 'Marmur', 'Granit', 'Bazalt', 'Beton', 'Ciemne deski', 'Białe deski',
      'Mech', 'Śnieg', 'Miedź', 'Stal', 'Złoto', 'Koral', 'Turkus', 'Ruda węgla', 'Ruda żelaza', 'Ruda miedzi',
      'Ruda złota', 'Ruda diamentu', 'Pień brzozy', 'Liście wiśni', 'Łóżko — kołdra', 'Łóżko — poduszka', 'Stół',
      'Regał z książkami', 'Skrzynia', 'Piec']
  }
};

let language = DEFAULT_LANGUAGE;
const listeners = new Set();

export function resolveLanguage(search = '', stored = null) {
  const requested = new URLSearchParams(search).get('lang');
  if (LANGUAGES.includes(requested)) return requested;
  if (LANGUAGES.includes(stored)) return stored;
  return DEFAULT_LANGUAGE;
}

function readStoredLanguage() {
  try {
    return globalThis.localStorage?.getItem(LANGUAGE_STORAGE_KEY) ?? null;
  } catch {
    return null;
  }
}

export function getLanguage() {
  return language;
}

export function locale() {
  return LOCALES[language];
}

export function hasMessage(key) {
  return typeof MESSAGES[language][key] === 'string' || typeof MESSAGES[DEFAULT_LANGUAGE][key] === 'string';
}

export function t(key, params = {}) {
  const template = MESSAGES[language][key] ?? MESSAGES[DEFAULT_LANGUAGE][key];
  if (typeof template !== 'string') return key;
  return template.replace(/\{(\w+)\}/g, (match, name) => (name in params ? String(params[name]) : match));
}

export function blockName(id) {
  return MESSAGES[language].blocks[id] ?? MESSAGES[DEFAULT_LANGUAGE].blocks[id] ?? String(id);
}

export function biomeName(biome) {
  return MESSAGES[language].biomes[biome] ?? biome;
}

export function structureName(index) {
  return MESSAGES[language].structures[index] ?? String(index);
}

export function setText(element, key, params) {
  element.dataset.i18n = key;
  if (params) element.dataset.i18nParams = JSON.stringify(params);
  else delete element.dataset.i18nParams;
  element.textContent = t(key, params);
}

export function translateDocument(root = globalThis.document) {
  if (!root) return;
  root.documentElement.lang = language;
  root.title = t('meta.title');
  for (const element of root.querySelectorAll('[data-i18n]')) {
    const params = element.dataset.i18nParams ? JSON.parse(element.dataset.i18nParams) : undefined;
    element.textContent = t(element.dataset.i18n, params);
  }
  // Only trusted dictionary strings with <b> markup use innerHTML.
  for (const element of root.querySelectorAll('[data-i18n-html]')) element.innerHTML = t(element.dataset.i18nHtml);
  for (const element of root.querySelectorAll('[data-i18n-attr]')) {
    for (const pair of element.dataset.i18nAttr.split(',')) {
      const [attribute, key] = pair.split(':');
      element.setAttribute(attribute.trim(), t(key.trim()));
    }
  }
  for (const button of root.querySelectorAll('[data-language]')) {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  }
}

export function setLanguage(next, { persist = true } = {}) {
  if (!LANGUAGES.includes(next)) return;
  language = next;
  if (persist) {
    try {
      globalThis.localStorage?.setItem(LANGUAGE_STORAGE_KEY, next);
    } catch {
      // Storage may be blocked; the choice still applies to this visit.
    }
  }
  translateDocument();
  for (const listener of listeners) listener(next);
}

export function onLanguageChange(listener) {
  listeners.add(listener);
}

export function initLanguage() {
  language = resolveLanguage(globalThis.location?.search ?? '', readStoredLanguage());
  translateDocument();
  for (const button of globalThis.document?.querySelectorAll('[data-language]') ?? []) {
    button.addEventListener('click', () => {
      setLanguage(button.dataset.language);
      button.blur();
    });
  }
  return language;
}
