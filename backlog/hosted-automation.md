# Hosted automation backlog

Track repository tasks that need GitHub Actions workflows or deployment
configuration. Homepage feed automation was previously blocked by org-pol;
the workflow can now be added locally, but hosted rollout is not verified.
The music catalogue workflow is future work and may share that blocker; no
direct org-pol denial for it is recorded.

## 1. Homepage Minecraft news and video feeds

**Status:** Implemented locally; merge and administrator rollout pending.

- [x] Add a [shared Pages workflow](../.github/workflows/pages.yml) for `main`
  pushes, manual runs, and refreshes approximately every four hours.
- [x] Generate feed JSON only in the full-site deployment artifact, avoiding
  bot commits and the `GITHUB_TOKEN` branch-build limitation.
- [x] Validate the live cache and preserve last-successful data and timestamps
  independently. Report partial and total failures; retain existing panel
  stale/unavailable behavior. Test partial failure and invalid-cache handling.
- [ ] Confirm organization policy permits the merged workflow to execute.
- [ ] Require **Site checks** for merging into `main`; failures otherwise
  remain advisory. PR validation must never deploy.
- [ ] Have an authorized administrator switch Pages from the `main` branch to
  GitHub Actions after the workflow is available on `main`.
- [ ] Verify a manual deployment and the existing homepage and games.
- [ ] Verify a scheduled run updates the live site and an older revision cannot
  replace a newer deployment.

See [scheduled publication and rollout](../README.md#scheduled-publication) for
cache lifecycle, explicit bootstrap, failure behavior, and rollback.

## 2. Music catalogue validation and deployment

**Status:** Future work; potential org-pol dependency, not a confirmed blocker.

- [ ] Confirm workflow path access before implementation.
- [ ] On pull requests, generate and validate the catalogue and run its tests
  plus Minecraft 0.3 tests. Do not publish pull-request artifacts.
  Make the catalogue validation check required for merging when introduced.
- [ ] On pushes to `main`, generate and validate the catalogue, then deploy the
  catalogue, audio files, and complete static site from the same commit.
- [ ] Use minimal workflow permissions, configure Pages deployment and
  concurrency, and ensure an older run cannot replace a newer deployment.
  Extend the shared Pages publisher rather than adding a competing deployer.
- [ ] Coordinate any Pages source change with an authorized administrator.
  Verify the published catalogue, audio URLs, and in-game playback.
- [ ] Decide whether generated catalogue data remains committed or is generated
  only in the deployment artifact; update the manual procedure accordingly.

See the [music catalogue runbook](../runbooks/music-catalogue.md) for detailed
build, deployment, and acceptance requirements.

## Not included

The ragdoll assessment's CI licensing concern is separate from org-pol and is
not counted as a blocked hosted-automation task.
