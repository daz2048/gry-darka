# Flappy Bird 0.2

Original Flappy Bird-style browser game from Ekipa spod Lipy. Fly between shaded green pipes over a pixel skyline. Three-frame pixel bird animation, crisp nearest-neighbor rendering, striped scrolling ground, arcade typography, and synthesized sound effects. All artwork is original; no copied Flappy Bird assets. Version 0.1 retains its original meadow graphics.

Working version on branch `archer-0.4-works-starts-n0w`, cloned from `../flappy-0.1/`. Make future Flappy Bird changes here by default; keep 0.1 as the preserved release unless explicitly requested otherwise.

## Play

You can open this directory's `index.html` directly in a browser with the full repository present. Artwork loads through native image elements rather than XHR, avoiding local-file CORS restrictions. Browser policies may still prevent local score storage; this displays a warning without blocking play.

Choose Flappy Bird 0.2 in the portfolio (after version 0.1), or visit http://localhost:8765/flappy-0.2/ after starting the repository game server:

```sh
python3 scripts/game-server.py start
```

Press **Lecimy** to start. Tap/click the playfield, Space, or Up to flap. Pass a whole gate to score one point. Ground, ceiling, and gate collisions end the run. Use the explicit restart button for another flight.

- **P** / pause button: pause or resume. Switching tabs or apps pauses automatically; resume explicitly.
- **M**: become an animated gray pigeon wearing a black top hat with a red ribbon and a matching red tie in immortal turbo mode. Scroll at 4x speed (384 units/second), ignore pipes, and survive the ceiling and ground; the bird stays on-screen at either edge. A visible indicator marks the mode. Press M again to restore the yellow bird, normal speed, and collisions, or reload the page to reset it. Both skins use the same hitbox.
- **S** / sound button: toggle sound effects and background music together. The original eight-bar tune "Little Wings" loops quietly during play: a bright square-wave melody, soft triangle arpeggios, and a rounded sine-wave bass at 108 BPM. Music stops on pause, mute, game-over, or switching tabs, continues its sequence on resume, and starts over on a new run. Playback begins only after interaction; unavailable audio does not block the game.
- **H**, **Esc**, or home button: return to the portfolio.

The fixed 360 x 640 world scales to the viewport without changing difficulty. The relaxed pace uses a speed of 96 units/second, pipe spacing of 225 units (about 2.34 seconds apart), and gap height of 220 units. Consecutive gap centers differ by at most 40 units. Gravity is 720 units/second squared and each flap sets upward velocity to 260 units/second for gentler flight. A smaller bird hitbox makes collisions forgiving.

## Technology

Phaser Arcade Physics for gravity and flight; scene delta time for scrolling. Uses the existing locally vendored engine at `../mario-0.3/vendor/phaser.min.js`, covered by its adjacent `PHASER-LICENSE.txt`. Keep that shared path available when deploying. No package install, build step, backend, or external runtime scripts required. Optional Google Fonts have local font fallbacks.

Music and effects are synthesized locally with the Web Audio API. The soundtrack is an original composition in `game.js`; no MP3, external music request, or third-party recording is used. Audio-clock scheduling keeps notes steady, and stopping music releases both scheduled and active voices.

Personal best and sound preference use `localStorage/flappy-podlasie-v2`, independently of version 0.1. Storage errors appear in the game and do not prevent play. Scores stay on this browser; no online leaderboard.

## Verification

Browser checks should cover: direct `file://` startup with asset XHR blocked, HTTP startup, start, keyboard and pointer flap, collision, one point per gate, obstacle recycling, clean restart, pause/resume, background pause, persisted best and mute settings, unavailable storage, and home navigation. Inspect desktop, portrait mobile, and short landscape viewports for overflow and canvas rendering. The portfolio's 0.2 card must link here and load its gameplay preview; version 0.1 is listed first.