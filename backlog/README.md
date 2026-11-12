# Development backlog

Planning documents and explicitly recorded prototype progress, not release claims.

## Minecraft 0.4: creative voxel sandbox

- [Active 0.4 release plan and historical voxel assessment](./voxel-sandbox-backlog.md)

Updated 2026-11-12. Confirmed 0.4 scope: desktop Mac, standalone Chrome stable,
creative exploration/building and reliable local saving. Mobile, survival,
crafting and multiplayer are later projects, not release blockers. Priorities:
measure the current world's save format, protect/restore creations, polish core
controls and verify the local and hosted release.

The [0.4 development copy](../klocki-podlasia-0.4/) has an expanded world and music,
but saving and release verification remain pending. The plan includes dependencies,
failure handling and measurable acceptance gates. Original 0.1 estimates and
results are preserved as historical context, not 0.4 evidence. Implementation,
tool installation and publication are not authorized by the plan alone.

## Fully editable ragdoll archery game

- [Feasibility, effort, Mac setup and Copilot responsibilities](./ragdoll-archery-assessment.md)
- [Game scope, architecture and build/release plan](./ragdoll-archery-design.md)
- [Implementation backlog with dependencies and acceptance tests](./ragdoll-archery-backlog.md)

Start with the assessment, then approve the physics/Web feasibility spike.
Do not install tooling or create a Unity project solely because these plans exist.

The existing [root backlog](../BACKLOG.md) covers other games and remains separate.
[Archers 0.4](../archers-0.4/) remains the current editable JavaScript game.
[Ragdoll Archers](../ragdoll-archers/) remains the frozen vanilla reference.

## Status and decisions

Initial assessment: 2026-11-09. No Unity implementation has been started.

Recommended, not yet approved:

1. Build an original game **using Unity**, not a new game engine.
2. Use Unity 6 LTS, C#, 2D physics and an orthographic camera.
3. Keep the Unity source and browser export separate from existing game versions.
4. Prove an active ragdoll and a deployed browser duel before funding more content.
5. Launch desktop-first; add mobile and local multiplayer after the core is stable.

The exact Unity patch, project name, production feature list and reference test
devices must be selected at implementation kickoff. Estimates are planning ranges,
not delivery commitments.
