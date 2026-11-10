# Flappy Podlasie 0.2

Original Flappy Bird-style browser game from Ekipa spod Lipy. Fly through wooden gates above a Podlasie meadow. Original SVG bird and scenery; synthesized sound effects. No copied Flappy Bird assets.

Working version on branch `archer-0.4-works-starts-n0w`, cloned from `../flappy-0.1/`. Make future Flappy Podlasie changes here by default; keep 0.1 as the preserved release unless explicitly requested otherwise.

## Play

Choose Flappy Podlasie 0.2 in the portfolio (after version 0.1), or visit http://localhost:8765/flappy-0.2/ after starting the repository game server:

```sh
python3 scripts/game-server.py start
```

Press **Lecimy** to start. Tap/click the playfield, Space, or Up to flap. Pass a whole gate to score one point. Ground, ceiling, and gate collisions end the run. Use the explicit restart button for another flight.

- **P** / pause button: pause or resume. Switching tabs or apps pauses automatically; resume explicitly.
- **M** / sound button: toggle audio.
- **H**, **Esc**, or home button: return to the portfolio.

The fixed 360 x 640 world scales to the viewport without changing difficulty. Speed is 138 units/second; gate spacing is 225 units; gap height is 180 units. Consecutive gap centers differ by at most 65 units. A smaller bird hitbox makes collisions forgiving.

## Technology

Phaser Arcade Physics for gravity and flight; scene delta time for scrolling. Uses the existing locally vendored engine at `../mario-0.3/vendor/phaser.min.js`, covered by its adjacent `PHASER-LICENSE.txt`. Keep that shared path available when deploying. No package install, build step, backend, or external runtime scripts required. Optional Google Fonts have local font fallbacks.

Personal best and sound preference use `localStorage/flappy-podlasie-v2`, independently of version 0.1. Storage errors appear in the game and do not prevent play. Scores stay on this browser; no online leaderboard.

## Verification

Browser checks should cover: start, keyboard and pointer flap, collision, one point per gate, obstacle recycling, clean restart, pause/resume, background pause, persisted best and mute settings, unavailable storage, and home navigation. Inspect desktop, portrait mobile, and short landscape viewports for overflow and canvas rendering. The portfolio's 0.2 card must link here and load its gameplay preview; version 0.1 is listed first.