# Shared music catalogue

## Current manual procedure

The shared [`music/`](../music/) directory contains public audio files for games.
The catalogue supports MP3, WAV, OGG and M4A. Actual codec and format support
varies by browser; an unsupported or damaged track reports a playback error.
The browser reads [`music/catalogue.json`](../music/catalogue.json); it cannot
reliably list a directory on GitHub Pages. **There is currently no automatic
catalogue refresh or custom Pages deployment workflow.**

1. Add, rename or remove supported audio files directly in `music/`. Only publish tracks
   you have permission to distribute; the files will be public. The generator
   scans this directory only, not subdirectories.
2. From the repository root, run:

   ```sh
   scripts/generate-music-catalogue.sh
   ```

   The catalogue is overwritten with a filename-sorted list of supported audio files
   (extension matching is case-insensitive). Display names are the filenames
   without the extension. Filenames containing backslashes or with a blank
   name before the extension are rejected; rename them and rerun the command.
   An empty directory produces an empty catalogue.
   The wrapper reports the scanned directory and whether the catalogue was
   created, updated or unchanged. Its track changes section lists added and
   removed filenames, or explicitly says when there are none. If the previous
   catalogue was invalid, the changes are unknown. The summary includes audio
   sizes, formats and elapsed time.
   The default is always the shared `music/` directory, regardless of the
   current directory. Pass a directory as an argument to generate a catalogue
   somewhere else; for example, from `music/scary_music/`, run
   `../../scripts/generate-music-catalogue.sh .` to scan that directory.
3. Review both the track changes and catalogue:

   ```sh
   git status --short -- music
   git diff -- music/catalogue.json
   ```

   New untracked files do not appear in `git diff`; inspect them via
   `git status` and, after staging, `git diff --cached -- music`. Include
   added and removed audio files **and** the regenerated catalogue in the same
   change. Do not remove unrelated music files.
4. Serve the repository locally, refresh Minecraft 0.3, and check that the
   soundtrack selector lists the expected names. Test playback in the target
   browsers, especially when adding a new format or codec. Test Random, an individual
   track, and Original music. Pause and resume and check the volume. If the
   catalogue is empty or fails to load, the game reports the problem and
   selects the original music.
5. After the changes reach `main` and Pages finishes deploying, check
   `https://daz2048.github.io/gry-darka/music/catalogue.json` and the game
   on the published site. Confirm added and removed names match the deployed
   files and play a track. The catalogue request uses `no-store`; if an older
   page or deployment is still visible, wait for deployment and reload.

Generator tests can be run with:

```sh
python3 -m unittest scripts.test_music_catalogue
```

## Future GitHub Actions automation

To be done later on .....

### Build and deployment requirements

- On a pull request, check out the proposed revision, run the generator and
  its tests, and run Minecraft 0.3's tests (`npm test --prefix
  klocki-podlasia-0.3`). Check that generation handles an empty folder,
  additions, removals, spaces, non-ASCII names and invalid filenames. Fail the
  job visibly on errors; do not deploy pull requests.
- On a push to `main`, check out that exact commit, run the same generation
  and validation, and publish the generated catalogue **and the audio files from
  that same checkout** in one Pages artifact. Publish the entire existing
  static site, including required hidden files such as `.nojekyll`, without
  including Git metadata. Do not auto-commit or push generated changes.
- Keep catalogue URLs relative to the repository's Pages base path and avoid
  stale catalogue responses. Verify the deployed catalogue and an audio URL,
  then test the selector and playback on the published game. A deploy should
  occur only after a successful build, and overlapping runs must not leave an
  older commit deployed after a newer one.
- Use minimal permissions: repository content read for building, and Pages
  write plus an ID token only for the deployment job. Configure the Pages
  environment and concurrency appropriately.
- The site currently uses branch-based Pages deployment from `main`. Once the
  workflow is available on the default branch and ready, an authorized
  administrator must switch the repository's Pages source to **GitHub
  Actions** and verify a successful deployment. Coordinate this change to
  avoid interrupting the existing site. Pull-request checks prevent merging
  only if configured as required in branch protection.
- Decide and document the catalogue's source-control lifecycle when enabling
  automation. The current branch-based site needs the generated file committed;
  an Actions-built artifact can instead generate it during deployment. Local
  development will still require running the generator after changing audio files.
  Update the manual steps above when the deployment model changes.

### Acceptance checks

- A PR adding or removing a track runs validation without publishing it.
- A `main` deployment contains exactly the catalogue and audio files from its commit;
  the site and existing games still load.
- Empty and missing catalogues have a visible fallback, and playback failures
  do not stop gameplay.
- The live catalogue and selector reflect a newly published track after the
  workflow completes; a removed track is no longer listed.
