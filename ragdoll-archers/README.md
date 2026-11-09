# Ragdoll Archers

This folder contains a self-hosted Unity WebGL build from [GameConsoleClub/Ragdoll-Archers](https://github.com/GameConsoleClub/Ragdoll-Archers), revision `f52b1205e5434201043cc2e3537c968680559b41`.

The upstream repository provides the game package under the MIT License; see [LICENSE](./LICENSE). The upstream attribution note names **Ericetto** as the original game creator. This local copy retains that attribution and the upstream license.

The Unity loader page is adapted for this repository. It loads the included Unity build assets locally and does not include the upstream obfuscated `gameloader-helper.js`.

## Frozen vanilla reference

Keep this directory unchanged as the vanilla reference for future comparisons.
Develop future variants in separate directories, not here. Keep their startup
scripts, styling and compiled assets independent; do not reintroduce shared game
code or synchronize variant changes back into this directory.
The menu link and local HTTP server are infrastructure, not shared gameplay code.

## Running locally and troubleshooting

Unity assets must be served over HTTP. From the repository root, run `./scripts/game-server.sh`, then open http://localhost:8765/ragdoll-archers/. If you double-click `index.html` (`file://`) while the local server is running, the page now redirects to its HTTP URL; if the server is unavailable, it displays instructions and a link.

Press H to return to the game menu, including while the game canvas is focused.

The page uses its own frozen [Unity startup script](./unity-loader.js). Loading and runtime errors appear on screen; expand **Loading diagnostics** for startup stages and Unity warnings. A local-file address checks the server before redirecting, and shows server instructions if it is unavailable instead of hanging at 0%.
