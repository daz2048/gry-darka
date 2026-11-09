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

Otwórz **http://localhost:8765/** lub np. **http://localhost:8765/ragdoll-mx-0.1/**. Serwer działa w tle także po zamknięciu terminala, dopóki trwa sesja użytkownika macOS.

Monitor pokazuje ostatnie i nowe żądania oraz liczbę żądań i błędów HTTP od momentu podłączenia. Kolory oznaczają klasy odpowiedzi HTTP; ustaw `NO_COLOR=1`, aby je wyłączyć. Ctrl+C zamyka monitor, ale nie zatrzymuje serwera. Ponowne uruchomienie monitora podłącza go do działającego serwera.

W monitorze naciskaj pojedyncze klawisze (bez Enter):

- `r` — uruchom serwer ponownie
- `s` — sprawdź stan serwera
- `q` — zamknij monitor, pozostawiając serwer w tle
- `x` — zatrzymaj serwer i zamknij monitor
- `d` — włącz lub wyłącz diagnostykę wrappera
- `h` lub `?` — pokaż skróty

Diagnostykę można też włączyć od razu flagą `-d` lub `--debug`, np. `./scripts/game-server.sh --debug`. Pokazuje dodatkowe informacje o działaniach wrappera na standardowym wyjściu błędów; `d` przełącza ją podczas pracy monitora.

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

---

## ⌨️ Szybka nawigacja: **ESC** lub **H**

Z dowolnej gry wciśnij **ESC** albo **H**, aby wrócić do menu głównego.

---

## 📋 Dostępne gry

### Ragdoll Archers
Self-hosted Unity WebGL build of the ragdoll archery game.
- [Zagraj »](ragdoll-archers/)
- Original game by Ericetto; package distributed under the upstream repository's MIT License.

### Ragdoll MX 0.1
Clone of the Ragdoll Archers Unity WebGL game, with the launcher labeled MX 0.1. Gameplay and compiled assets are unchanged.
- [Play »](ragdoll-mx-0.1/)
- [Source and license information](ragdoll-mx-0.1/README.md)

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
