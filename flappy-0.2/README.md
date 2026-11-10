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
- **M**: become an animated gray pigeon wearing a black top hat with a red ribbon and a matching red tie in immortal turbo mode. Scroll at 4x speed (560 units/second), ignore pipes, and survive the ceiling and ground; the bird stays on-screen at either edge. A visible indicator marks the mode. Press M again to restore the equipped shop skin, normal speed, and collisions, or reload the page to reset it. All skins use the same hitbox.
- **B** / star button: open the skin shop. A running game pauses; close the shop with its close button, Escape, or the backdrop, then resume explicitly.
- **S** / sound button: toggle sound effects and background music together. The original eight-bar tune "Little Wings" loops quietly during play: a bright square-wave melody, soft triangle arpeggios, and a rounded sine-wave bass at 108 BPM. Music stops on pause, mute, game-over, or switching tabs, continues its sequence on resume, and starts over on a new run. Playback begins only after interaction; unavailable audio does not block the game.
- **H**, **Esc**, or home button: return to the portfolio.

The fixed 360 x 640 world scales to the viewport without changing difficulty. The forgiving pace uses a speed of 140 units/second, pipe spacing of 230 units (about 1.64 seconds apart), and gap height of 180 units. Consecutive gap centers differ by at most 45 units and remain between 190 and 390. Gravity is 950 units/second squared and each flap sets upward velocity to 310 units/second. All skins retain the same 29 x 23 collision box; only the difficulty settings changed.

## Technology

M mode keeps the normal blue sky, city, and green pipes. The plump pigeon skin is accompanied only by slightly brighter, softer colors; pressing M again restores the exact normal appearance.

Phaser Arcade Physics for gravity and flight; scene delta time for scrolling. Uses the existing locally vendored engine at `../mario-0.3/vendor/phaser.min.js`, covered by its adjacent `PHASER-LICENSE.txt`. Keep that shared path available when deploying. No package install, build step, backend, or external runtime scripts required. Optional Google Fonts have local font fallbacks.

Music and effects are synthesized locally with the Web Audio API. The soundtrack is an original composition in `game.js`; no MP3, external music request, or third-party recording is used. Audio-clock scheduling keeps notes steady, and stopping music releases both scheduled and active voices.

Personal best, sound preference, coin balance, owned skins, and equipped skin use `localStorage/flappy-podlasie-v2`, independently of version 0.1. Existing saves retain their best score and sound setting and receive the four starter skins. Invalid inventory IDs and balances are ignored. Storage errors appear in the game and do not prevent play or shopping within the current session. Progress stays on this browser; no online leaderboard.

## Skin Shop

There are 32 animated skins. Gold, Mint, Blue, and Rose are free. Every passed pipe immediately awards 5 coins, including in turbo mode; a pipe only pays once. Other skins cost 10 to 120 coins. Purchases equip the skin immediately; owned skins can be switched freely without paying again.

The collection includes color variants and distinct costumes: ninja, pirate, aviator, wizard, king, astronaut, robot, bee, ladybug, sailor, Santa, pumpkin, unicorn, flower, chef, cowboy, detective, neon visor, phoenix, and the top-hat pigeon. The gentleman pigeon skin is cosmetic; only M enables turbo and immortality. Selecting a skin during M mode takes effect when M is switched off.

The shop has live artwork previews and All / Owned filters. Skins are generated locally with canvas drawing, without extra downloads or reading local-image pixels, preserving direct-file support. Skins change appearance only, never physics or collision size.

## Verification

Browser checks should cover: direct `file://` startup with asset XHR blocked, HTTP startup, start, keyboard and pointer flap, collision, one point per gate, obstacle recycling, clean restart, pause/resume, background pause, persisted best and mute settings, unavailable storage, and home navigation. Inspect desktop, portrait mobile, and short landscape viewports for overflow and canvas rendering. The portfolio's 0.2 card must link here and load its gameplay preview; version 0.1 is listed first.