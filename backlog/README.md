# Development backlog

Planning documents, not implemented features.

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
