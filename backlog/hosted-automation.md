# Hosted automation backlog

Track repository tasks that need GitHub Actions workflows or deployment
configuration. The homepage feed automation is confirmed blocked by org-pol.
The music catalogue workflow is future work and may share that blocker; no
direct org-pol denial for it is recorded.

## 1. Homepage Minecraft news and video feeds

**Status:** Blocked by org-pol; the workflow path was inaccessible.

- [ ] Resolve the org-pol restriction before adding a workflow.
- [ ] Refresh both feeds approximately every four hours and publish generated
  JSON to GitHub Pages. A commit made with `GITHUB_TOKEN` does not itself
  trigger a Pages build; confirm the publishing source and any required
  settings change before deploying.
- [ ] Preserve the last successful data and timestamp independently for each
  feed, report refresh failures, and retain the panel's stale/unavailable
  states.
- [ ] Verify a scheduled run updates the live site. Test that when one feed
  fails, its previous data is retained while the other feed can still refresh.

## 2. Music catalogue validation and deployment

**Status:** Future work; potential org-pol dependency, not a confirmed blocker.

- [ ] Confirm workflow path access before implementation.
- [ ] On pull requests, generate and validate the catalogue and run its tests
  plus Minecraft 0.3 tests. Do not publish pull-request artifacts.
- [ ] On pushes to `main`, generate and validate the catalogue, then deploy the
  catalogue, audio files, and complete static site from the same commit.
- [ ] Use minimal workflow permissions, configure Pages deployment and
  concurrency, and ensure an older run cannot replace a newer deployment.
- [ ] Coordinate any Pages source change with an authorized administrator.
  Verify the published catalogue, audio URLs, and in-game playback.
- [ ] Decide whether generated catalogue data remains committed or is generated
  only in the deployment artifact; update the manual procedure accordingly.

See the [music catalogue runbook](../runbooks/music-catalogue.md) for detailed
build, deployment, and acceptance requirements.

## Not included

The ragdoll assessment's CI licensing concern is separate from org-pol and is
not counted as a blocked hosted-automation task.
