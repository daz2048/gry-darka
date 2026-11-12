# Minecraft 0.3 — development copy

Active working version on branch `Klocki-Podlasia-0.3`, cloned from `../klocki-podlasia-0.2/`. Future Minecraft development on this branch targets this directory by default. Keep versions 0.1 and 0.2 preserved unless explicitly asked otherwise. This copy initially retains the same gameplay and prototype limitations as 0.2.

Original desktop-first creative voxel sandbox for Ekipa spod Lipy. Explore a
64 × 32 × 64 Podlasie meadow, visit three linked villages, and build with 29
unlimited solid materials. Includes cottages, village wells, trees, roaming farm
animals, iron golems, mineable ore veins, bounded terrain, exposed-face chunk
rendering, walking/jumping, block picking, placement checks and safe recovery.

**Prototype limits:** no world/settings save, audio, mobile controls, survival,
crafting, multiplayer or offline/PWA guarantee. Refreshing or creating a new
world loses your creation. This is not the complete release described in the
[backlog](../backlog/voxel-sandbox-backlog.md).

## Run

From the repository root, start the existing server:

```sh
./scripts/game-server.sh
```

Open <http://localhost:8765/klocki-podlasia-0.3/> or select version 0.3 in the
portfolio. Use HTTP: ES modules do not load by opening this HTML file directly.
No npm install, compilation, external font, CDN, account or game server is needed.
Requires a desktop keyboard/mouse and a browser with WebGL2.

## Controls

- **Graj — przechwyć mysz**: capture the mouse after a click. Escape releases it
  and pauses. If capture is denied, retry or select **Graj bez przechwytywania**.
- In the alternate mode, drag across the world to look and use Q/E to edit.
- WASD / arrows: move; Space: jump; mouse: look.
- Left click / Q: remove; right click / E: place (click editing in captured mode).
- Choose a palette set: **Podstawowe**, **Budowlane**, **Ozdobne**, or **Rudy**. Keys 1–8 select a material within the current set; the mouse wheel cycles through all 29 materials and switches sets automatically. Palette swatches also select materials. Reach is five blocks.
- P / Escape: pause; H / **Menu gier**: return to the portfolio.
- **Wróć na start**: find a safe supported position without resetting the world.
- **Nowa łąka**: confirmed replacement with a different seed, not a saved slot.
- Fullscreen and lower resolution are optional; denied fullscreen leaves windowed play.

**Navigation exception:** unlike the 2D games, Escape pauses instead of returning
to the portfolio because browsers use it to release pointer lock. H still goes home.
Switching apps/tabs pauses and clears held movement; resuming is always explicit.

## Building Materials

The original eight materials remain unchanged. Inherited from version 0.2 are building and decorative blocks plus coal, iron, copper, gold, and diamond ores. Ore veins are generated deterministically below the surface and can be mined or placed like other blocks. The central cottage is joined by two small villages, each with homes and a well; seven residents wander inside their homes, three iron golems patrol the roads, and pigs, cows, sheep, and chickens visit nearby pastures.

## Development and verification

```sh
env ATOM_LOCK_SKIP_NATIVE_AUDIO=1 ATOM_LOCK_SKIP_NATIVE_UI=1 \
  node --test klocki-podlasia-0.3/tests/*.test.js
```

Pure tests cover generation, exposed faces, cross-chunk edits, picking and player
collision/movement. Browser checks should include captured and drag look, walking,
jump, edits/overlap rejection, palette, new-world confirmation, safe recovery,
pause/background/resume, denied pointer lock, resize, lower resolution and home.
The pause panel's diagnostics show the seed, frames, draw calls, live geometries,
first-render time and frame-time median/p95. Local readings are not network
load benchmarks or evidence of hosted Safari/Windows/mobile compatibility.

## Dependency

Three.js **0.180.0 / r180**, MIT, vendored from the published npm package via
`https://cdn.jsdelivr.net/npm/three@0.180.0/`:

- `build/three.module.js`
- `build/three.core.js` (required transitive module)
- `examples/jsm/controls/PointerLockControls.js`
- `LICENSE`, preserved as [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)

The local import map maps `three` to the vendored module. Do not mix versions
of these files. All game art is original; no Minecraft game assets are used.
