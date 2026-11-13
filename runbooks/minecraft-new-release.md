# Starting a new Minecraft release

Follow this procedure for every new Minecraft version (for example 0.5.1 after
0.5). Goal: the previous release stays **100% unchanged** while the new one
gets the new features. Feature scope is decided separately, after the steps
below are in place.

## Rules

- Work on a branch named `Minecraft-<version>`, created from the updated
  `origin/main` after the previous release was merged.
- Never edit `minecraft/<previous>/`, older `klocki-podlasia-*` directories, or
  existing files under `minecraft/shared/vendor/`. Fixes to an old release are
  a separate, explicit decision.
- **Three.js:** if the library version stays the same, keep the single shared
  copy. The new release's import map points at
  `../shared/vendor/three/<version>/three.module.js` and its game code imports
  `../shared/vendor/three/<version>/PointerLockControls.js`. Never duplicate
  vendor files. A library upgrade means a new pinned directory (see
  [`minecraft/README.md`](../minecraft/README.md)) adopted only by the new release.
- **Music:** shared with all releases through [`music/`](../music/) and its
  catalogue; do not duplicate tracks per version. Adding tracks is allowed
  only if existing entries stay intact (see
  [music-catalogue.md](music-catalogue.md)); never remove or rename tracks a
  previous release plays.
- **Storage:** every release has its own browser storage; releases never open
  each other's databases. Worlds move between versions only through the
  export/import backup feature.

## Steps

1. **Tag the previous release** on its merge commit (for example
   `minecraft-0.5-release`) so it can always be restored exactly. Optionally
   add a check that fails if `minecraft/<previous>/` differs from that tag.
2. **Copy the previous release** into `minecraft/<version>/` in **one commit
   with no feature changes**, so later diffs show only real work. Replace the
   placeholder README with the real one (describe the version, saves and
   differences from the previous release).
3. **Isolate storage** in the same copy (or an immediate follow-up commit):
   - IndexedDB name `SAVE_DATABASE` in `saves.js` becomes `minecraft-<version>`.
   - localStorage key `LANGUAGE_STORAGE_KEY` in `i18n.js` becomes
     `minecraft-<version>-language`.
   - Update the existing tests that assert these names, and add a test that
     the new release never opens the previous release's database.
   - Update `package.json` name/version and visible version labels
     (`brand.mode` in `index.html` and `i18n.js`).
4. **Verify the pure copy** before adding features: the new release's tests
   pass and the previous release's tests still pass unchanged.
5. **Build features only in `minecraft/<version>/`.** Keep the `./file.js?v=N`
   import pattern (bump `N` when a file changes), and add every UI string to
   both `en` and `pl` in `i18n.js`.
6. **Update the site last, in its own commit:**
   - Add the release to the chooser ([`minecraft/index.html`](../minecraft/index.html))
     and the root [`index.html`](../index.html); mark the previous release as
     archived/previous.
   - Add it to [`help.html`](../help.html), [`updates.html`](../updates.html)
     and [`sitemap.xml`](../sitemap.xml), following
     [player-updates.md](player-updates.md).
   - Leave the previous release's URL and card working.
   - Update `scripts/test_player_help.py` and the version lists in
     [`minecraft/README.md`](../minecraft/README.md) and the root README.

## Checks before every PR

From the repository root:

```sh
# Must be empty, or show only intentional additions
git diff --stat origin/main -- minecraft/<previous> minecraft/shared/vendor klocki-podlasia-0.* music

node --test minecraft/<previous>/tests/*.test.js   # same pass count as at release
node --test minecraft/<version>/tests/*.test.js
python3 -m unittest scripts.test_player_help scripts.test_music_catalogue
git diff --check
```

For the 0.5 → 0.5.1 transition, `node --test minecraft/0.5/tests/*.test.js`
must still report 117 passing tests.
