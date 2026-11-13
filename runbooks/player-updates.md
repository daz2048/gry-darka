# Player help and release notes

The public player guide is [help.html](../help.html). The canonical player-facing
release history is [updates.html](../updates.html), published alongside the games
on the existing GitHub Pages site. Both pages work without JavaScript, a build
step, or a GitHub account. The reporting link does require a GitHub account.

## Publishing an update

1. Update the relevant game section in the guide when controls, supported devices,
   save behavior or limitations change. Keep Polish and English content consistent.
2. Prepend an article to the release history in the same commit as the change.
   Include the actual publication date, game name and version (or Portfolio),
   player-visible additions/fixes, and important limitations or save impacts.
   Give it a stable unique ID such as `2026-11-13-help` for direct links.
   Do not present planned work or unverified compatibility as shipped.
3. Keep older entries intact except for clearly identified factual corrections.
   Do not generate player notes directly from raw commits or backlog checkboxes.
4. Check the hub, help, updates and contextual game links on desktop and a narrow
   viewport. In-game guides open a new tab so they cannot discard the current
   world/run. Minecraft, Mario and Flappy expose help in start/pause overlays;
   Archers and Zombie pause active play when their guide is opened. Castle Duel
   is turn-based; an in-flight shot may finish while help is open.
5. Commit and push, then integrate the branch into the site's publishing branch
   through the normal repository workflow. A topic-branch push alone is not proof
   of a live deployment. Verify both public pages and the changed game after
   publication; do not claim deployment based only on Git push success.

For a substantial, intentionally tagged game release, optionally create a GitHub
Release using a game-specific tag (for example `minecraft-0.3.1`) and link back
to the corresponding article on the site. GitHub Releases are a secondary channel
for contributors/subscribers, not the only place players can read updates.
Do not create a tag or Release for every small documentation change.

Run the guide-link regression checks from the repository root:

```sh
python3 -B -m unittest scripts/test_player_help.py
```

## Integration constraints

- Keep the frozen `ragdoll-archers/` vanilla reference untouched. Its help is
  reachable through the hub's guide, not by modifying the reference.
- Help must not repurpose H or Escape: existing game navigation and pointer-lock
  behavior stay intact. Resume remains explicit.
- Minecraft 0.3 guide labels use its existing EN/PL translation mechanism. Keep
  all runtime i18n import URLs on the same cache version.
- The guide is online documentation, not a promise of offline availability.
  Castle Duel's service worker caches its own shell; it does not cache the
  external guide. Basic controls remain visible inside the game offline.
