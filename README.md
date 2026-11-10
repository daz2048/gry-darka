# Gry Darka, Janka i Ekipy 🎮

Zbiór małych gier przeglądarowe — **graj od razu, bez instalacji**.

## 🚀 Graj teraz!

**[👉 OTWÓRZ GRY](https://dariusz22p.github.io/gry-darka/)**

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

---

## 📋 Dostępne gry

### Flappy Podlasie
Oryginalna gra w stylu Flappy Bird: przelatuj przez drewniane bramy nad podlaska laka i pobij swoj rekord. Pierwsza gra w menu portfolio.
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

#### Zombie Max 0.2 (w przygotowaniu)
Nowa wersja rozwijana jako osobny wariant.
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
