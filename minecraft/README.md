# Minecraft versions

Minecraft 0.5 is the current development version, copied from 0.4.
Run the repository server and open <http://localhost:8765/minecraft/0.5/>.
The [version chooser](index.html) also links to older releases.

## Layout and release isolation

- `0.5/`: independent game code, assets, translations and tests.
- `shared/vendor/three/0.180.0/`: pinned Three.js r180 modules, controls and MIT
  licence, copied unchanged from Minecraft 0.4.
- Existing 0.1-0.4 directories and public URLs remain unchanged at the repository
  root. Do not propagate development changes into those releases.
- Audio and its generated catalogue remain in the repository's [music](../music/)
  directory.

New versions belong in `minecraft/<version>/`. Keep gameplay, world generation,
save logic and translations version-local. Review potential shared helpers in
each new-version PR; identical code alone is not a reason to extract it.

Shared vendor releases are immutable. Never replace files in an existing pinned
directory, mix library releases, or use a mutable `latest` dependency. Add a new
versioned directory for an upgrade and update only the games adopting it. Keep
the licence and transitive modules with each release. The shared package metadata
allows Node tests to load the same ES modules used in browsers; no install or
build step is required.

## Saves and validation

0.5 uses `minecraft-0.5` for IndexedDB and `minecraft-0.5-language` for language
preferences. It does not automatically copy the multi-world 0.4 database:
export a world in 0.4 and import the backup in 0.5. Compatible backup schemas
are unchanged. The inherited importer for legacy single-slot 0.3 saves remains
available when the 0.5 catalogue is empty; it never alters the source database.

Before publishing a new version, check the homepage and chooser, shared library
imports, music, help and menu links (including H), both languages, save/reload,
and compatible backup imports. Run from the repository root:

```sh
node --test minecraft/0.5/tests/*.test.js
python3 -m unittest scripts.test_player_help
```
