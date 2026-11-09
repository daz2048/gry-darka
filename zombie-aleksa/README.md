# Zombie Alx — Napor Zombie (Wariant Aleksa)

Wariant rozwijany przez **Aleksandra Panasiuka**. Przepisany od zera jako endless survival w stylu Evony.

## Graj teraz

**[ZAGRAJ](https://dariusz22p.github.io/gry-darka/zombie-aleksa/)**

## Jak grac

Bronisz bazy po prawej stronie ekranu. Zombie nadchodzą z lewej i idą w prawo. Twoja ekipa strzela automatycznie w lewo.

- Poruszaj ekipą w górę i w dół
- Zbieraj bramy (przelatują przez planszę) — pozytywne dają bonusy do obrażeń, HP i szybkostrzelności
- Omijaj lub ostrzeliwuj bramy negatywne (czerwone, ze znakiem ostrzeżenia)
- Kupuj ulepszenia w sklepie

## Zombie i eventi

- **Endless** — gra nie ma końca, trudność rośnie z czasem
- **5 tierów zombie:** bardzo wolny / wolny / normalny / szybki / opancerzony
- **60 s** — pojawia się żółty zombie (200 HP)
- **180 s** — pojawia się czerwony zombie (160 HP)
- **300 s** — boss (2000 HP)
- HP zwykłych zombie skaluje z czasem i siłą twojej ekipy

## Bramy

Bramy przelatują przez planszę od lewej do prawej. Przejście przez bramę (twoja ekipa jest w jej pionie) **odbiera** bonus.

- **Pozytywne** — dają +DMG, +HP lub +szybkostrzelność
- **Negatywne (~35%)** — jaskrawoczerwone ze znakiem ostrzeżenia — odbierają statystyki; omijaj je lub ostrzeliwuj do wartości dodatniej
- Ostrzelana brama zmienia wartość o FLAT_INC na trafienie; cap na bramie ogranicza maksymalny bonus

## Overheat (HEAVY mode)

Gdy szybkostrzelność osiagnie poziom 4+, ekipa przechodzi w tryb **HEAVY**:
- Szybkostrzelność spada o połowę
- Obrażenia x4
- Netto: ok. 2x DPS — wciąż opłacalny tryb

## Sklep

Kliknij ikonę sklepu (lewy górny róg) aby otworzyć sklep.

| Ulepszenie | Koszt | Typ |
|---|---|---|
| +0.5 DMG | 50 | powtarzalny |
| +0.2 Fire Rate | 100 | powtarzalny |
| +50 HP | 150 | powtarzalny |
| Laser | 5000 | jednorazowy |

Laser to ciągły promień w lewo, multi-hit w pasie +-55 px, 1/5 siły zwykłego strzału.

## Sterowanie

- **W** — ruch ekipy w górę
- **S** — ruch ekipy w dół
- **Klik ikony sklepu** — otwiera sklep
- **R** — restart
- **ESC / H** — powrót do menu

## Developer

- **Aleksander Panasiuk** — prowadzący wariant

## Inne warianty

- [Napór Zombie (Vanilla)](https://dariusz22p.github.io/gry-darka/napor-zombie-vanilla/) — prototyp bazowy
- [Max 0.1](https://dariusz22p.github.io/gry-darka/zombie-max-0.1/) — poprzedni wariant Maksa
- [Max 0.2](https://dariusz22p.github.io/gry-darka/zombie-max-0.2/) — nowa wersja

---

[Wróc do głównego menu](https://dariusz22p.github.io/gry-darka/)
