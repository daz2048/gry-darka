# Minecraft 0.3 — development copy

Active working version on branch `Klocki-Podlasia-0.3`, cloned from `../klocki-podlasia-0.2/`. Future Minecraft development on this branch targets this directory by default. Keep versions 0.1 and 0.2 preserved unless explicitly asked otherwise. This copy initially retains the same gameplay and prototype limitations as 0.2.

Original desktop-first creative voxel sandbox for Ekipa spod Lipy. Explore a
256 × 32 × 256 world with eleven biomes, three lakes and two streams, visit seventeen linked villages, and build with 37
unlimited materials. Includes furnished cottages, village wells, trees, roaming farm
animals, foxes, rabbits, iron golems, mineable ore veins, bounded terrain, nearby exposed-face chunk
rendering, walking/jumping, block picking, placement checks and safe recovery.
Roadside structures include a climbable watchtower, a campsite, stone ruins and
a farmhouse with fields.

**Prototype limits:** no world/settings save, sound effects, mobile controls, survival,
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
- Choose a palette set: **Podstawowe**, **Budowlane**, **Ozdobne**, **Rudy i przyroda**, or **Meble**. Keys 1–8 select an item within the current set; the mouse wheel cycles through all 37 items and switches sets automatically. Palette swatches also select items. Reach is five blocks.
- On narrow screens the palette uses compact icons; hover an icon to see its
  name. The icons also retain accessible labels.
- P / Escape: pause; H / **Menu gier**: return to the portfolio.
- Follow the roads to the villages and roadside structures. The HUD shows your
  biome and X/Z coordinates; the pause panel lists destinations. Jump up the watchtower steps.
- **Wróć na start**: find a safe supported position without resetting the world.
- **Nowa łąka**: confirmed replacement with a different seed, not a saved slot.
- Fullscreen and lower resolution are optional; denied fullscreen leaves windowed play.
- **Muzyka / Głośność muzyki**: enable or mute the original ambient music and
  adjust its volume in the start/pause panel. It begins after choosing a play mode
  and stops when the game is paused or loses focus. Settings are not saved.

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
blocks, so edits remain when you return during the same session.

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

Pure tests cover generation, exposed faces, cross-chunk edits, picking and player
collision/movement. Browser checks should include captured and drag look, walking,
jump, edits/overlap rejection, palette, new-world confirmation, safe recovery,
pause/background/resume, denied pointer lock, resize, lower resolution and home.
The pause panel's diagnostics show the seed, frames, draw calls, live geometries,
first-render time and frame-time median/p95. Local readings are not network
load benchmarks or evidence of hosted Safari/Windows/mobile compatibility.
The original melodic instrumental soundtrack is generated locally with Web
Audio, with soft keys, bass and sustained harmonies. It does not contain
Minecraft music or require downloads.

## Dependency

Three.js **0.180.0 / r180**, MIT, vendored from the published npm package via
`https://cdn.jsdelivr.net/npm/three@0.180.0/`:

- `build/three.module.js`
- `build/three.core.js` (required transitive module)
- `examples/jsm/controls/PointerLockControls.js`
- `LICENSE`, preserved as [THREE-LICENSE.txt](vendor/THREE-LICENSE.txt)

The local import map maps `three` to the vendored module. Do not mix versions
of these files. All game art is original; no Minecraft game assets are used.
