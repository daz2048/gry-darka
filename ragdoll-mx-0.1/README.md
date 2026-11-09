# Ragdoll MX 0.1

A clone of the local [Ragdoll Archers](../ragdoll-archers/) Unity WebGL game,
with the launcher title and loading heading changed to **Ragdoll MX 0.1**.
A persistent **RAGDOLL MX 0.1** badge in the top-right corner identifies the
version during loading and gameplay without intercepting game input.
Gameplay and compiled game assets are unchanged. The compiled game's
internal title remains Ragdoll Archers; the original Unity source is not included.

The build comes from [GameConsoleClub/Ragdoll-Archers](https://github.com/GameConsoleClub/Ragdoll-Archers),
revision `f52b1205e5434201043cc2e3537c968680559b41`.
The upstream package's [MIT License](./LICENSE) and original creator attribution
to **Ericetto** are retained.

## Running locally

Run `./scripts/game-server.sh` from the repository root, then open
http://localhost:8765/ragdoll-mx-0.1/. Unity assets must be served over HTTP.
Opening the launcher through `file://` checks the local server and redirects
there, or displays startup instructions if the server is unavailable.

The launcher uses its own [Unity startup script](./unity-loader.js)
and [H menu shortcut](./home-shortcut.js).
Loading and runtime errors appear on screen; expand **Loading diagnostics**
for initialization stages and warnings.

## Development isolation

Make MX changes only in this directory. [Ragdoll Archers](../ragdoll-archers/)
is the frozen vanilla reference and must remain unchanged.
Startup scripts, styles and compiled assets are independent files, not shared
imports or links. Keep them independent so MX development cannot change the
reference game. Both games still use the repository's menu and HTTP server.
