# Ragdoll MX 0.1

An independent, editable browser archery duel. This is **not** a modified or
decompiled Unity build. The original Unity game remains playable at
[Ragdoll Archers](../ragdoll-archers/).

## Play

Open `http://localhost:8765/ragdoll-mx-0.1/` using the repository's local
server, or open this directory through GitHub Pages. No build step or external
network service is needed.

- Aim with the pointer; hold the primary pointer button and release to shoot.
- Hold longer (up to one second) for a faster, stronger arrow.
- Aim above the rival: arrows fall under gravity. Dots preview the current arc.
- Space also charges/releases a shot using the current pointer aim.
- P or the Pause button pauses; losing focus also pauses a live duel.
- R or New match resets health, round number and the session score.
- After a win/loss, Next round creates a fresh duel and retains the score.
- H or Menu returns to the game menu. Sound is opt-in.
- Pointer capture supports dragging outside the arena; cancellation discards
  the charge without firing.

## Editable source

- [game.js](./game.js): physics, articulated actors, combat, AI, rendering and input.
- [style.css](./style.css): responsive page and overlays.
- [index.html](./index.html): launcher, accessible status and controls.

Uses the repository's existing MIT-licensed Matter.js 0.19.0 library at
`../pojedynek-zamkow-janek-i-baranek/matter.min.js`. Keep that shared file
available when deploying. No Unity binaries, original-game artwork, audio or
scripts are loaded by this version. Artwork is procedural and sounds are synthesized.

The legacy Unity files retained in this directory came from
[GameConsoleClub/Ragdoll-Archers](https://github.com/GameConsoleClub/Ragdoll-Archers),
revision `f52b1205e5434201043cc2e3537c968680559b41`. They are no longer loaded
by the MX launcher. Their upstream [LICENSE](./LICENSE) and attribution to
**Ericetto** remain intact. Unity startup troubleshooting and diagnostics now
apply to the separate [original game's launcher](../ragdoll-archers/).

Each actor has 11 dynamic bodies and 10 anatomical joint constraints. Living
actors use angular muscle controllers and a soft hip balance force, not static
anchors. Defeated actors lose active control but retain their physical joints.
Arrows use swept segment/body intersections, attach in body-local coordinates
and apply physical hit reactions. The simulation runs at a fixed 60 Hz with
bounded catch-up; old arrows and hit effects expire.

## First-release scope and follow-up

This release focuses on one arena, one bow, one enemy type, health, headshots,
round outcomes, pause, restart and session scoring. It has no shop, bosses,
multiplayer or saved progression. Enemy firing intervals shorten with rounds
to a minimum of 1.7 seconds.

Before expanding content, validate:

1. Both actors remain connected and upright while aiming and after nonfatal hits.
2. Charged arrows hit reliably, including headshots, and remain attached.
3. Both victory and defeat lead to a usable next round; new match clears scores.
4. Pause/focus loss freezes combat and cancels charging.
5. Narrow layouts, pointer cancellation and browser audio behave correctly.

Open [tests.html](./tests.html) through the same HTTP server to run deterministic,
dependency-free browser regression checks against the unchanged game script.
The runner advances animation frames itself, checks a minute of ragdoll stability,
actual charged projectile hits, both round outcomes, pause and reset behavior.

Next: tune the bow/impact feel with playtesting, then add touch-specific UX
and browser/performance coverage before weapons or progression.
