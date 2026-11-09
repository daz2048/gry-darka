# Ragdoll MX 0.1

This is a separate copy of the self-hosted Ragdoll Archers Unity WebGL build from [GameConsoleClub/Ragdoll-Archers](https://github.com/GameConsoleClub/Ragdoll-Archers), revision `f52b1205e5434201043cc2e3537c968680559b41`. The game build itself is unchanged, so its in-game title remains Ragdoll Archers.

The upstream repository provides the game package under the MIT License; see [LICENSE](./LICENSE). The upstream attribution note names **Ericetto** as the original game creator. This local copy retains that attribution and the upstream license.

The Unity loader page is adapted for this repository. It loads the included Unity build assets locally and does not include the upstream obfuscated `gameloader-helper.js`.

## Running locally and troubleshooting

Unity assets must be served over HTTP, not opened by double-clicking `index.html` (`file://`). From the repository root, run `./scripts/game-server.sh`, then open http://localhost:8765/ragdoll-mx-0.1/.

The page uses the shared [Unity startup script](../scripts/unity-loader.js). Loading and runtime errors appear on screen; expand **Loading diagnostics** for startup stages and Unity warnings. A local-file address shows server instructions immediately instead of hanging at 0%.
