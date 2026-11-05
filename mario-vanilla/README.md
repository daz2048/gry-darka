# Mario Vanilla

Original side-scrolling platformer inspired by classic run-and-jump games.
Standalone copy of the **Mario 1.0** platformer, listed as **Mario Vanilla** in
the collection's main menu.
Three worlds, coins, hidden star bonuses, patrolling enemies, shield blocks,
moving platforms, checkpoints, and a final gate. No Nintendo assets or levels.

Original synthesized chiptune effects accompany jumps, landings, coins, bonuses,
shield blocks, enemy hits, checkpoints, extra lives, and deaths. Short jingles
play at the start, level completion, game over, and victory. Audio starts after
interaction; M or the sound button mutes all effects immediately.

Open `index.html` directly in a modern browser, or use the collection's main
menu. No build step, package installation, or server is required. The engine is
bundled locally; only the optional web fonts use the network, with local fallbacks.

## Controls

| Action | Keyboard |
| --- | --- |
| Move | Left / Right or A / D |
| Jump | Space / Up / W (hold for a higher jump) |
| Pause / resume | P |
| Restart the whole adventure | R |
| Mute | M |
| Main menu | Escape / H |

Touch devices have independent left, right, and jump buttons, supporting
simultaneous movement and jumping. Desktop toolbar buttons have hover labels.

Jump on enemies to defeat them; side contact costs a life unless shielded.
Hit a marked block from below and collect its shield. Falling still costs a life.
Every 25 coins earns an extra life. Checkpoints reset when entering a new world.
Pause and restart do not persist progress across page reloads.

## Structure

- `game.js`: Phaser scene, authored levels, generated pixel-art textures, audio.
- `style.css`: responsive layout and controls.
- `preview.svg`: original menu artwork.
- `vendor/phaser.min.js`: Phaser 3.90.0, MIT licensed; see the bundled license.

## Verification

Test keyboard and multi-touch movement, short/long jumps, platform landings,
moving-platform travel, coin/star/shield collection, underside block hits,
enemy stomps and side hits, pit deaths, checkpoint respawn, three-world
completion, pause/blur, restart, mute, and the menu link. Check desktop,
portrait mobile, and landscape mobile views, including offline loading.