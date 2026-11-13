export const LANGUAGES = ['en', 'pl'];
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'minecraft-0.4-language';
const LOCALES = { en: 'en-GB', pl: 'pl-PL' };

export const MESSAGES = {
  en: {
    'meta.title': 'Minecraft 0.4 — creative building with Ekipa spod Lipy',
    'language.group': 'Language',
    'viewport.label': '3D block world',
    'brand.mode': 'VERSION 0.4 · CREATIVE MODE',
    'status.loading': 'Loading save…',
    'button.save': 'Save',
    'button.reloadSave': 'Load the current save',
    'button.retryMigration': 'Retry save migration',
    'button.pause': 'Pause · P',
    'button.saveOptions': 'Pause for save options · P',
    'link.menuHotkey': 'Games menu · H',
    'link.menu': 'Games menu',
    'link.help': 'Help (new tab)',
    'worldLabel.eyebrow': 'YOUR WORLD',
    'world.nameLabel': 'World name (max. 32 characters)',
    'world.defaultName': 'Meadow',
    'world.newDefault': 'New world',
    'world.nameRequired': 'Enter a world name.',
    'worldPicker.label': 'Your worlds',
    'backup.export': 'Export',
    'backup.exportNamed': 'Export {world}',
    'backup.import': 'Import world',
    'backup.file': 'World backup file',
    'backup.help': 'Export a world to keep an external backup. Import restores a Minecraft 0.4 backup as a new world, never replacing an existing one. Maximum file size: 8 MiB.',
    'backup.working': 'Preparing world backup transfer...',
    'backup.download': 'Download requested: {filename}. Keep the file somewhere safe; the browser controls where it is saved.',
    'backup.imported': 'Imported {world} as a new world. Select it from the list to play.',
    'backup.importedRefreshFailed': 'Imported {world}, but the world list could not be refreshed: {error}. Reload the page to see the imported world.',
    'backup.failed': 'World backup transfer failed: {error}',
    'error.backup-crypto': 'World backups require HTTPS or localhost and Web Crypto support.',
    'error.backup-size': 'The backup file exceeds the 8 MiB limit.',
    'error.backup-invalid': 'The backup file is invalid or incomplete.',
    'error.backup-incompatible': 'This backup format or world version is not supported by Minecraft 0.4.',
    'error.backup-checksum': 'The backup checksum does not match. The file may be damaged.',
    'worldPicker.empty': 'No saved worlds yet. Create a world to begin.',
    'worldPicker.choosePrompt': 'Choose a world or create a new one.',
    'worldPicker.limitReached': 'World limit reached ({count}). Delete a world to create another.',
    'worldPicker.lastSaved': 'Last saved {time}',
    'worldPicker.play': 'Play {world}',
    'worldPicker.create': 'Create a new world',
    'worldPicker.choose': 'Worlds & backups',
    'worldPicker.damaged': 'This save is damaged and cannot be loaded.',
    'worldPicker.unavailable': 'The world list could not be loaded. Your saves have not been changed.',
    'worldPicker.current': 'Current world',
    'worldPicker.manage': 'Manage world',
    'worldPicker.nameLabel': 'New world name',
    'worldPicker.rename': 'Rename',
    'worldPicker.delete': 'Delete',
    'worldPicker.cancel': 'Cancel',
    'worldPicker.renameNamed': 'Rename {world}',
    'worldPicker.deleteNamed': 'Delete {world}',
    'worldPicker.renameQuestion': 'Enter a new name for “{world}”.',
    'worldPicker.deleteQuestion': 'Delete “{world}” and its recovery copy? This cannot be undone.',
    'worldPicker.created': 'Created {world}. Select it, or use the Play {world} button to choose a play mode.',
    'worldPicker.deleted': 'Deleted {world}. Your other worlds have been kept.',
    'worldPicker.renamed': 'Renamed the world to {world}.',
    'worldPicker.actionFailed': 'World action failed: {error}',
    'worldPicker.changedRefreshFailed': 'The world was changed, but the list could not be refreshed: {error}. Reload the page before trying again.',
    'details.saving': 'Saving…\nLocation: {location}',
    'details.labelSaved': 'Save completed successfully.',
    'details.labelLoaded': 'Last valid save.',
    'details.saved': '{label} World: {name}. Saved {time}.\nBrowser storage location: {location} (this browser profile).\nRecovery copy: {backup}\nStorage persistence: {persistence}\nEstimated data size: {size} MiB ({bytes} B).\nThis world is a database record, not a separate world file. The size excludes database overhead and the previous copy.',
    'details.backup.checking': 'checking…',
    'details.backup.available': 'available in this browser profile (not a separate backup).',
    'details.backup.missing': 'no valid previous copy available.',
    'details.backup.unavailable': 'unable to check.',
    'details.persistence.checking': 'checking…',
    'details.persistence.persistent': 'persistent; protected from automatic eviction, but can still be cleared manually.',
    'details.persistence.evictable': 'not persistent; the browser may automatically remove site data.',
    'details.persistence.unavailable': 'unable to check.',
    'details.pending': 'Newer changes are waiting for the next save.',
    'details.error': 'Save failed: {error}\nAttempted location: {location}\nNo new save was confirmed. The size of the unsaved record is not available.',
    'notice.saveFailed': 'Save failed: {error}',
    'notice.pauseSaved': 'Your world was saved successfully.',
    'notice.saveDebug': 'World ID: {id}\nCommitted revision: {revision}\nSave timestamp: {time}\nNo separate world file: the browser manages the database files.',
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
    'overlay.eyebrow': 'Podlasie Blocks · The Lime Tree Crew · <b class="version-highlight">v0.4</b>',
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
    'places.text': 'Follow the roads. The biome and coordinates are shown in this menu; enable them during play in the settings below.',
    'settings.sensitivity': 'Mouse sensitivity',
    'settings.lowQuality': 'Lower resolution',
    'settings.coordinates': 'Show biome and coordinates during play',
    'settings.music': 'Music',
    'settings.musicChoice': 'Soundtrack',
    'settings.volume': 'Music volume',
    'button.start': 'Play',
    'button.dragStart': 'Play',
    'button.captureHint': '(capture mouse)',
    'button.dragHint': '(without capturing)',
    'button.recover': 'Back to start',
    'button.newWorld': 'New world',
    'button.fullscreen': 'Full screen',
    'button.restoreBackup': 'Restore the previous save',
    'button.confirmReset': 'Yes, new world',
    'button.cancelReset': 'No, keep my build',
    'button.stay': 'Stay and try again',
    'button.leave': 'Leave without saving',
    'recovery.label': 'Save recovery',
    'recovery.current': 'The current save is damaged. We loaded the previous copy; confirm restoring it before you continue.',
    'recovery.migrated': 'The previous save was moved. The current data is damaged; confirm restoring the previous copy before you continue.',
    'reset.label': 'Confirm new world',
    'reset.normal': 'A new world will be created. Your current world will be kept. Continue?',
    'reset.recovery': 'A new world will be created. The damaged save and recovered copy will be kept. Continue?',
    'reset.corrupt': 'A new world will be created. The damaged save will remain available to delete later. Continue?',
    'reset.migration': 'A new world will be created. The unmigrated database remains untouched. Continue?',
    'leave.label': 'Unsaved changes',
    'leave.text': 'Saving failed. If you leave now, changes since the last save will be lost.',
    'metrics.summary': 'Model diagnostics',
    'metrics.waiting': 'Waiting for the renderer.',
    'diagnostics.waiting': 'Waiting for local game server diagnostics.',
    'diagnostics.git': 'Branch: {branch} · working tree: {state}\nLast commit: {hash}\nCommit age: {age} ({date})',
    'diagnostics.clean': 'clean',
    'diagnostics.dirty': 'modified (uncommitted changes)',
    'diagnostics.gitUnavailable': 'Git metadata unavailable: {error}',
    'diagnostics.server': 'Local server: {health} · started {started}\nSince server start: {requests} requests · {httpErrors} HTTP errors · {serverErrors} server exceptions',
    'diagnostics.healthy': 'responding; no server errors observed',
    'diagnostics.attention': 'responding; attention required',
    'diagnostics.lastError': 'Last server error: {error}',
    'diagnostics.unavailable': 'Local server diagnostics unavailable ({error}). Use the repository game server; if it is already running, restart it to enable diagnostics. Hosted/static servers do not provide this information.',
    'diagnostics.checked': 'Server checked {age}.',
    'diagnostics.page': 'Page loaded {age} · uncaught browser errors observed: {count}',
    'diagnostics.refresh': 'Refresh diagnostics',
    'diagnostics.showLogs': 'Show recent server logs',
    'diagnostics.hideLogs': 'Hide server logs',
    'diagnostics.logsRecent': 'Recent server logs (current log file; refreshed while visible):',
    'diagnostics.logsTruncated': 'Recent server logs (truncated to the last 200 lines / 64 KiB):',
    'diagnostics.logsEmpty': 'No log entries.',
    'diagnostics.logsLoading': 'Loading recent server logs…',
    'diagnostics.logsError': 'Cannot load server logs: {error}. Use Refresh diagnostics to retry.',
    'diagnostics.contextLost': 'WebGL rendering context lost.',
    'metrics.text': 'Three.js r{revision} · WebGL2\nWorld: {size} · seed: {seed}\nFPS: {fps} · draw calls: {calls} · geometries: {geometries}\nRender buffer: {resolution} px · pixel ratio: {pixelRatio}\nFirst frame (local): {first} ms\nGame samples: {samples} · median: {median} ms · p95: {p95} ms\nEdits: {edits} · position: {position}',
    'save.saved': 'Saved {time}',
    'save.saving': 'Saving…',
    'save.dirty': 'Unsaved changes',
    'save.dirtyBlocked': 'Changes not saved — choose recovery or a new world.',
    'save.conflict': 'Save conflict — load the current version.',
    'save.failed': 'Not saved — try again.',
    'save.recoveryPending': 'Copy restored — confirm saving.',
    'save.corrupt': 'Damaged save — we will not overwrite it.',
    'save.newWorld': 'New world — saving…',
    'save.noWorld': 'No world selected',
    'save.migrationFailed': 'The save could not be moved — the old copy is kept.',
    'save.loadFailed': 'The save could not be loaded — temporary session.',
    'load.preparing': 'Preparing the meadow…',
    'load.loading': 'Loading the world and save…',
    'load.ready': 'Saved world ready. Choose how to play.',
    'load.migrated': 'The previous save was moved safely. Choose how to play.',
    'load.recoveredPosition': 'Your position was blocked. We found a safe place; save to keep it for next time.',
    'load.recoveryReady': 'The previous copy is ready to restore.',
    'load.corrupt': 'The save is damaged. Choose another world or create a new one; the damaged save is kept.',
    'load.noWorld': 'Create a world to begin.',
    'load.newSaved': 'New world saved. Choose how to play.',
    'load.newFailed': 'The new world could not be saved safely. The previous world is still active.',
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
    'notice.noSafeSpot': 'No safe place found. Remove obstacles or create a new world.',
    'notice.safe': 'You are in a safe place. The world is unchanged.',
    'notice.noFullscreen': 'This browser does not support full screen. Play in the window.',
    'notice.fullscreenFailed': 'Full screen is unavailable. The game keeps running in the window.',
    'music.failed': 'The music could not start. Play without it or try again.',
    'music.stopped': 'The music stopped because of an error. The game continues.',
    'music.random': 'Random track',
    'music.original': 'Original music',
    'music.loading': 'Loading music catalogue…',
    'music.empty': 'No tracks are available. Original music is selected.',
    'music.catalogueFailed': 'Music catalogue could not be loaded. Original music is selected.',
    'music.fallbackRandom': 'The selected soundtrack is unavailable. A random track is selected instead.',
    'music.fallbackOriginal': 'No playable tracks are available. Original music is selected instead.',
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
    'error.world-not-found': 'That world no longer exists. Refresh the world list and try again.',
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
    'meta.title': 'Minecraft 0.4 — kreatywne budowanie Ekipy spod Lipy',
    'language.group': 'Język',
    'viewport.label': 'Trójwymiarowy świat klocków',
    'brand.mode': 'WERSJA 0.4 · TRYB KREATYWNY',
    'status.loading': 'Ładowanie zapisu…',
    'button.save': 'Zapisz',
    'button.reloadSave': 'Wczytaj aktualny zapis',
    'button.retryMigration': 'Ponów migrację zapisu',
    'button.pause': 'Pauza · P',
    'button.saveOptions': 'Pauza i opcje zapisu · P',
    'link.menuHotkey': 'Menu gier · H',
    'link.menu': 'Menu gier',
    'link.help': 'Pomoc (nowa karta)',
    'worldLabel.eyebrow': 'TWÓJ ŚWIAT',
    'world.nameLabel': 'Nazwa świata (maks. 32 znaki)',
    'world.defaultName': 'Łąka',
    'world.newDefault': 'Nowy świat',
    'world.nameRequired': 'Wpisz nazwę świata.',
    'worldPicker.label': 'Twoje światy',
    'backup.export': 'Eksportuj',
    'backup.exportNamed': 'Eksportuj: {world}',
    'backup.import': 'Importuj świat',
    'backup.file': 'Plik kopii zapasowej świata',
    'backup.help': 'Eksportuj świat, aby zachować zewnętrzną kopię zapasową. Import odtwarza kopię Minecraft 0.4 jako nowy świat i nigdy nie zastępuje istniejącego. Maksymalny rozmiar pliku: 8 MiB.',
    'backup.working': 'Przygotowywanie kopii świata...',
    'backup.download': 'Rozpoczęto pobieranie: {filename}. Zachowaj plik w bezpiecznym miejscu; przeglądarka wybiera miejsce zapisu.',
    'backup.imported': 'Zaimportowano {world} jako nowy świat. Wybierz go z listy, aby zagrać.',
    'backup.importedRefreshFailed': 'Zaimportowano {world}, ale nie można odświeżyć listy światów: {error}. Odśwież stronę, aby zobaczyć zaimportowany świat.',
    'backup.failed': 'Przenoszenie kopii świata nie powiodło się: {error}',
    'error.backup-crypto': 'Kopie światów wymagają HTTPS lub localhost oraz obsługi Web Crypto.',
    'error.backup-size': 'Plik kopii zapasowej przekracza limit 8 MiB.',
    'error.backup-invalid': 'Plik kopii zapasowej jest nieprawidłowy lub niekompletny.',
    'error.backup-incompatible': 'Ten format kopii lub wersja świata nie jest obsługiwana przez Minecraft 0.4.',
    'error.backup-checksum': 'Suma kontrolna kopii nie zgadza się. Plik może być uszkodzony.',
    'worldPicker.empty': 'Nie masz jeszcze zapisanych światów. Utwórz pierwszy.',
    'worldPicker.choosePrompt': 'Wybierz świat albo utwórz nowy.',
    'worldPicker.limitReached': 'Osiągnięto limit światów ({count}). Usuń jeden, aby utworzyć kolejny.',
    'worldPicker.lastSaved': 'Ostatni zapis: {time}',
    'worldPicker.play': 'Graj: {world}',
    'worldPicker.create': 'Utwórz nowy świat',
    'worldPicker.choose': 'Światy i kopie zapasowe',
    'worldPicker.damaged': 'Ten zapis jest uszkodzony i nie można go wczytać.',
    'worldPicker.unavailable': 'Nie można wczytać listy światów. Zapisy nie zostały zmienione.',
    'worldPicker.current': 'Bieżący świat',
    'worldPicker.manage': 'Zarządzaj światem',
    'worldPicker.nameLabel': 'Nowa nazwa świata',
    'worldPicker.rename': 'Zmień nazwę',
    'worldPicker.delete': 'Usuń',
    'worldPicker.cancel': 'Anuluj',
    'worldPicker.renameNamed': 'Zmień nazwę: {world}',
    'worldPicker.deleteNamed': 'Usuń: {world}',
    'worldPicker.renameQuestion': 'Wpisz nową nazwę świata „{world}”.',
    'worldPicker.deleteQuestion': 'Usunąć świat „{world}” i jego kopię zapasową? Tej czynności nie można cofnąć.',
    'worldPicker.created': 'Utworzono świat {world}. Wybierz go albo użyj przycisku „Graj: {world}”, aby wybrać tryb gry.',
    'worldPicker.deleted': 'Usunięto świat {world}. Pozostałe światy zostały zachowane.',
    'worldPicker.renamed': 'Zmieniono nazwę świata na {world}.',
    'worldPicker.actionFailed': 'Operacja na świecie nie powiodła się: {error}',
    'worldPicker.changedRefreshFailed': 'Świat został zmieniony, ale nie można odświeżyć listy: {error}. Odśwież stronę przed kolejną próbą.',
    'details.saving': 'Zapisywanie…\nMiejsce: {location}',
    'details.labelSaved': 'Zapis zakończony pomyślnie.',
    'details.labelLoaded': 'Ostatni poprawny zapis.',
    'details.saved': '{label} Świat: {name}. Zapisano {time}.\nMiejsce w pamięci przeglądarki: {location} (ten profil przeglądarki).\nKopia zapasowa: {backup}\nTrwałość pamięci: {persistence}\nSzacowany rozmiar danych: {size} MiB ({bytes} B).\nTen świat jest rekordem bazy danych, nie osobnym plikiem świata. Rozmiar nie obejmuje narzutu bazy ani poprzedniej kopii.',
    'details.backup.checking': 'sprawdzanie…',
    'details.backup.available': 'dostępna w tym profilu przeglądarki (nie jest osobną kopią zapasową).',
    'details.backup.missing': 'brak poprawnej poprzedniej kopii.',
    'details.backup.unavailable': 'nie można sprawdzić.',
    'details.persistence.checking': 'sprawdzanie…',
    'details.persistence.persistent': 'trwała; chroniona przed automatycznym usunięciem, ale nadal można ją usunąć ręcznie.',
    'details.persistence.evictable': 'nietrwała; przeglądarka może automatycznie usunąć dane strony.',
    'details.persistence.unavailable': 'nie można sprawdzić.',
    'details.pending': 'Nowsze zmiany czekają na kolejny zapis.',
    'details.error': 'Zapis nie powiódł się: {error}\nMiejsce próby: {location}\nNie potwierdzono nowego zapisu. Rozmiar niezapisanego rekordu nie jest dostępny.',
    'notice.saveFailed': 'Zapis nie powiódł się: {error}',
    'notice.pauseSaved': 'Twój świat został bezpiecznie zapisany.',
    'notice.saveDebug': 'ID świata: {id}\nZatwierdzona rewizja: {revision}\nCzas zapisu: {time}\nBrak osobnego pliku świata: plikami bazy zarządza przeglądarka.',
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
    'overlay.eyebrow': 'KLOCKI PODLASIA · EKIPA SPOD LIPY · <b class="version-highlight">v0.4</b>',
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
    'places.text': 'Podążaj drogami. Biom i współrzędne są widoczne w tym menu; włącz je podczas gry w ustawieniach poniżej.',
    'settings.sensitivity': 'Czułość myszy',
    'settings.lowQuality': 'Niższa rozdzielczość',
    'settings.coordinates': 'Pokazuj biom i współrzędne podczas gry',
    'settings.music': 'Muzyka',
    'settings.musicChoice': 'Ścieżka dźwiękowa',
    'settings.volume': 'Głośność muzyki',
    'button.start': 'Graj',
    'button.dragStart': 'Graj',
    'button.captureHint': '(przechwyć mysz)',
    'button.dragHint': '(bez przechwytywania)',
    'button.recover': 'Wróć na start',
    'button.newWorld': 'Nowy świat',
    'button.fullscreen': 'Pełny ekran',
    'button.restoreBackup': 'Odzyskaj poprzedni zapis',
    'button.confirmReset': 'Tak, nowy świat',
    'button.cancelReset': 'Nie, zachowaj budowlę',
    'button.stay': 'Zostań i spróbuj ponownie',
    'button.leave': 'Wyjdź bez zapisu',
    'recovery.label': 'Odzyskiwanie zapisu',
    'recovery.current': 'Bieżący zapis jest uszkodzony. Wczytaliśmy poprzednią kopię; potwierdź jej odzyskanie przed dalszą grą.',
    'recovery.migrated': 'Poprzedni zapis został przeniesiony. Bieżące dane są uszkodzone; potwierdź odzyskanie poprzedniej kopii przed dalszą grą.',
    'reset.label': 'Potwierdzenie nowego świata',
    'reset.normal': 'Powstanie nowy świat. Bieżący świat zostanie zachowany. Kontynuować?',
    'reset.recovery': 'Powstanie nowy świat. Uszkodzony zapis i odzyskana kopia zostaną zachowane. Kontynuować?',
    'reset.corrupt': 'Powstanie nowy świat. Uszkodzony zapis będzie można później usunąć. Kontynuować?',
    'reset.migration': 'Powstanie nowy świat. Niezmigrowana baza pozostanie nietknięta. Kontynuować?',
    'leave.label': 'Niezapisane zmiany',
    'leave.text': 'Nie udało się zapisać. Jeśli wyjdziesz teraz, zmiany od ostatniego zapisu zostaną utracone.',
    'metrics.summary': 'Diagnostyka modelu',
    'metrics.waiting': 'Oczekiwanie na renderer.',
    'diagnostics.waiting': 'Oczekiwanie na diagnostykę lokalnego serwera gry.',
    'diagnostics.git': 'Gałąź: {branch} · katalog roboczy: {state}\nOstatni commit: {hash}\nWiek commita: {age} ({date})',
    'diagnostics.clean': 'czysty',
    'diagnostics.dirty': 'zmodyfikowany (niezatwierdzone zmiany)',
    'diagnostics.gitUnavailable': 'Metadane Git niedostępne: {error}',
    'diagnostics.server': 'Lokalny serwer: {health} · uruchomiony {started}\nOd uruchomienia serwera: {requests} żądań · {httpErrors} błędów HTTP · {serverErrors} wyjątków serwera',
    'diagnostics.healthy': 'odpowiada; nie zaobserwowano błędów serwera',
    'diagnostics.attention': 'odpowiada; wymaga uwagi',
    'diagnostics.lastError': 'Ostatni błąd serwera: {error}',
    'diagnostics.unavailable': 'Diagnostyka lokalnego serwera niedostępna ({error}). Użyj serwera gry z repozytorium; jeśli już działa, uruchom go ponownie, aby włączyć diagnostykę. Serwery hostowane/statyczne nie udostępniają tych informacji.',
    'diagnostics.checked': 'Serwer sprawdzony {age}.',
    'diagnostics.page': 'Stronę wczytano {age} · zaobserwowane nieobsłużone błędy przeglądarki: {count}',
    'diagnostics.refresh': 'Odśwież diagnostykę',
    'diagnostics.showLogs': 'Pokaż ostatnie logi serwera',
    'diagnostics.hideLogs': 'Ukryj logi serwera',
    'diagnostics.logsRecent': 'Ostatnie logi serwera (bieżący plik; odświeżane, gdy są widoczne):',
    'diagnostics.logsTruncated': 'Ostatnie logi serwera (ograniczone do ostatnich 200 wierszy / 64 KiB):',
    'diagnostics.logsEmpty': 'Brak wpisów w logu.',
    'diagnostics.logsLoading': 'Wczytywanie ostatnich logów serwera…',
    'diagnostics.logsError': 'Nie można wczytać logów serwera: {error}. Użyj przycisku Odśwież diagnostykę, aby ponowić próbę.',
    'diagnostics.contextLost': 'Utracono kontekst renderowania WebGL.',
    'metrics.text': 'Three.js r{revision} · WebGL2\nŚwiat: {size} · seed: {seed}\nFPS: {fps} · draw calls: {calls} · geometrie: {geometries}\nBufor renderowania: {resolution} px · współczynnik pikseli: {pixelRatio}\nPierwsza klatka (lokalnie): {first} ms\nPróbki gry: {samples} · mediana: {median} ms · p95: {p95} ms\nEdycje: {edits} · pozycja: {position}',
    'save.saved': 'Zapisano {time}',
    'save.saving': 'Zapisywanie…',
    'save.dirty': 'Niezapisane zmiany',
    'save.dirtyBlocked': 'Zmiany nie zapisane — wybierz odzyskiwanie lub nowy świat.',
    'save.conflict': 'Konflikt zapisu — wczytaj aktualną wersję.',
    'save.failed': 'Nie zapisano — ponów próbę.',
    'save.recoveryPending': 'Odzyskano kopię — potwierdź zapis.',
    'save.corrupt': 'Uszkodzony zapis — nie nadpisujemy go.',
    'save.newWorld': 'Nowy świat — zapisujemy…',
    'save.noWorld': 'Nie wybrano świata',
    'save.migrationFailed': 'Nie można przenieść zapisu — stara kopia jest zachowana.',
    'save.loadFailed': 'Nie można wczytać zapisu — sesja tymczasowa.',
    'load.preparing': 'Przygotowujemy łąkę…',
    'load.loading': 'Wczytujemy świat i zapis…',
    'load.ready': 'Zapisany świat gotowy. Wybierz sposób sterowania.',
    'load.migrated': 'Poprzedni zapis został bezpiecznie przeniesiony. Wybierz sposób sterowania.',
    'load.recoveredPosition': 'Pozycja była zablokowana. Znaleźliśmy bezpieczne miejsce; zapisz, aby zachować ją na przyszłość.',
    'load.recoveryReady': 'Poprzednia kopia jest gotowa do odzyskania.',
    'load.corrupt': 'Zapis jest uszkodzony. Wybierz inny świat albo utwórz nowy; uszkodzony zapis zostanie zachowany.',
    'load.noWorld': 'Utwórz świat, aby rozpocząć.',
    'load.newSaved': 'Nowy świat zapisany. Wybierz sposób sterowania.',
    'load.newFailed': 'Nie udało się bezpiecznie zapisać nowego świata. Poprzedni świat pozostał aktywny.',
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
    'notice.noSafeSpot': 'Brak bezpiecznego miejsca. Usuń przeszkody lub utwórz nowy świat.',
    'notice.safe': 'Jesteś w bezpiecznym miejscu. Świat pozostał bez zmian.',
    'notice.noFullscreen': 'Ta przeglądarka nie udostępnia pełnego ekranu. Graj w oknie.',
    'notice.fullscreenFailed': 'Pełny ekran niedostępny. Gra nadal działa w oknie.',
    'music.failed': 'Nie można uruchomić muzyki. Graj bez niej lub spróbuj ponownie.',
    'music.stopped': 'Muzyka została zatrzymana z powodu błędu. Gra działa dalej.',
    'music.random': 'Losowy utwór',
    'music.original': 'Oryginalna muzyka',
    'music.loading': 'Wczytywanie katalogu muzyki…',
    'music.empty': 'Brak utworów. Wybrano oryginalną muzykę.',
    'music.catalogueFailed': 'Nie można wczytać katalogu muzyki. Wybrano oryginalną muzykę.',
    'music.fallbackRandom': 'Wybrana muzyka jest niedostępna. Zamiast niej wybrano losowy utwór.',
    'music.fallbackOriginal': 'Brak utworów możliwych do odtworzenia. Zamiast nich wybrano oryginalną muzykę.',
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
    'error.world-not-found': 'Ten świat już nie istnieje. Odśwież listę i spróbuj ponownie.',
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
