# Editable ragdoll archery: implementation backlog

All tasks are **not started**. This document does not authorize installing Unity,
overwriting an existing game or starting the full production scope.
Dependencies below are actual prerequisites; numbering alone is not a dependency.

Definitions and budgets: [design](./ragdoll-archery-design.md).
Effort, machine assessment and staffing: [assessment](./ragdoll-archery-assessment.md).

## Milestones and go/no-go gates

| Gate | Deliverable | Decision |
|---|---|---|
| G0 | Approved bounded scope, chosen Editor, blank hosted Web build | Continue only if this Mac/toolchain and Pages path work |
| G1 | Stable active ragdoll, trustworthy arrow hit and minimal Web duel | Core proof: commit more budget, simplify, or stop |
| G2 | Fun single-player vertical slice with three arrow types | Human playtest acceptance before shops/content expansion |
| G3 | Editable economy, saves, sandbox and bounded content set | Feature completeness against an agreed inventory |
| G4 | Local modes, touch UX, performance and release evidence | Publish only after target-platform checks pass |

If a gate fails, record the failing fixture, actual measurements and reduced-scope
option. Do not repeatedly generate new systems on top of a failed physics core.

## Phase 0: scope, tools and repeatable builds

- [ ] **RA-001 - Inventory the reference and define an original release**
  - Dependency: none.
  - Play and record observable mechanics: modes, aim/charge, stamina, damage,
    enemies, arrows, upgrades, progression, settings and failure states.
  - Separate observed behavior from assumptions; use our own assets and naming.
  - Produce a must/should/later checklist, approved exclusions and test hardware.
  - Acceptance: no vague "copy everything"; each promised feature has a testable
    outcome and a priority. Confirm Unity versus continued Phaser development.

- [ ] **RA-002 - Install and validate the Mac toolchain**
  - Dependency: RA-001 and user approval of installation/license steps.
  - Select/pin Unity LTS patch, Hub, Web module, IDE integration and required
    Apple tooling. Measure RAM/free disk; verify exact macOS compatibility.
  - Acceptance: Editor opens a project, C# compiles and debugging can stop at a
    breakpoint; record paths/versions and license eligibility without secrets.

- [ ] **RA-003 - Establish source control and reference protection**
  - Dependency: RA-001, RA-002.
  - Create the approved Unity project directory, `.gitignore`, `.meta`/text
    serialization policy and dependency locks. Capture a vanilla SHA-256 manifest
    outside the reference folder and a read-only release check against it.
  - Acceptance: clean clone imports successfully; no `Library` or credentials
    committed; validation detects a deliberate fixture change to reference data.

- [ ] **RA-004 - Export and serve a blank Web player**
  - Dependency: RA-003.
  - Create reproducible Editor build method and lightweight Web template with
    loading/error UI. Build locally and publish a temporary preview artifact.
  - Acceptance: localhost and GitHub Pages subpath load in Chrome and Safari,
    with no missing resources; no game backend or custom server headers required.
  - **G0:** approve tooling before gameplay work.

## Phase 1: the risky physics proof

- [ ] **RA-005 - Build the instrumented physics sandbox**
  - Dependency: RA-003.
  - Platform, reset controls, force applicator, joint visualization, speed/error
    readings and repeatable test seeds.
  - Acceptance: automated fixture can simulate fixed-duration scenarios and
    report failing bodies/joints with numeric evidence.

- [ ] **RA-006 - Create the articulated actor prefab**
  - Dependency: RA-005.
  - Anatomy, masses, colliders, collision matrix and limited hinge joints.
  - Acceptance: passive drop tests preserve connectivity, floor contact and
    finite transforms; dimensions and mass ratios are editor-tunable.

- [ ] **RA-007 - Implement bounded active balance**
  - Dependency: RA-006.
  - Upright/ground support, muscle targets, stun recovery and dead-body release.
  - Acceptance: two actors pass the 10-minute rest/perturbation fixture and joint
    thresholds from the design; defeated bodies stop correcting toward standing.
  - Stop/rethink within the spike budget if tuning cannot meet the gate.

- [ ] **RA-008 - Integrate aiming, hands and a single bow**
  - Dependency: RA-007.
  - Pointer/keyboard input, actual bow socket, arm targets, charge and release.
  - Acceptance: aim sweep does not break joints or upset balance; release and
    cancellation are distinct; focus loss cannot fire a delayed shot.

- [ ] **RA-009 - Implement swept projectile impacts**
  - Dependency: RA-008.
  - First-hit resolution, owner filter, body-part damage, recoil, attachment,
    lifetime and impact identity.
  - Acceptance: 1,000 configured maximum-speed fixtures have no missed expected
    impacts or duplicate damage; attachments follow moving limbs.

- [ ] **RA-010 - Prove the loop in the actual Web build**
  - Dependency: RA-004, RA-009.
  - Minimal enemy firing, health, defeat and reset; original placeholder visuals.
  - Acceptance: complete 20 tiny duel/reset cycles in a browser; profile the Web
    player, not just Editor. Confirm no change to the reference hashes.
  - **G1:** human accepts physical behavior and basic aiming; otherwise simplify
    and re-test before purchasing/creating content.

## Phase 2: enjoyable single-player vertical slice

- [ ] **RA-011 - Add resource and damage rules**
  - Dependency: RA-009.
  - Health, stamina, charge curves, headshots, knockdown and armor floor/caps.
  - Acceptance: table-driven tests cover extremes and invalid tuning; HUD values
    match actual rules, and one kill produces one reward event.

- [ ] **RA-012 - Add readable, fair enemy AI**
  - Dependency: RA-010, RA-011.
  - Ballistic aim, difficulty error/cadence, stamina and platform selection.
  - Acceptance: enemies obey resource limits; easy/hard fixtures have measurable
    different hit rates, and the player can win without a cheat.

- [ ] **RA-013 - Complete menu/round/pause/outcome flow**
  - Dependency: RA-010.
  - Explicit transitions, restart, next round, focus/visibility pause and menu.
  - Acceptance: win, loss, pause during charge, repeated restart and returning
    from background all work without accumulating handlers/timers.

- [ ] **RA-014 - Build the first three original weapon definitions**
  - Dependency: RA-009, RA-011.
  - Basic, fire and frost as an initial effect test set, subject to scope approval.
  - Acceptance: definition edits alter behavior without changing dispatch code;
    status expiry and stacking policies are tested and visible.

- [ ] **RA-015 - Add first-pass original visuals, audio and HUD**
  - Dependency: RA-013, RA-014.
  - Clear characters/projectiles, health/stamina, hit reaction, mute/volume,
    loading/version display, instructions and audio user-gesture handling.
  - Acceptance: a new player understands firing and defeat; audio failure is
    diagnosed without an unexplained frozen loading screen.

- [ ] **RA-016 - Playtest and tune the vertical slice**
  - Dependency: RA-012, RA-015.
  - Observe at least three new players, record aiming errors and confusing UI,
    tune bounded values and rebuild.
  - Acceptance: all can start/restart unaided, and at least two voluntarily play
    another round. Record subjective feedback alongside technical metrics.
  - **G2:** approve or revise game feel before economy/content expansion.

## Phase 3: editable progression and content

- [ ] **RA-017 - Implement isolated versioned saves**
  - Dependency: RA-013.
  - Unique namespace/product identity, schema, migration, validation, backup,
    export/import, reset confirmation and storage-failure reporting.
  - Acceptance: migration/corruption/denied-storage tests pass; reload preserves
    valid progress; vanilla and Archers 0.4 storage is never changed.

- [ ] **RA-018 - Implement economy and purchases**
  - Dependency: RA-011, RA-014, RA-017.
  - Starting currency, rewards, owned/equipped IDs, prices and upgrade caps.
  - Acceptance: insufficient funds and duplicate purchases cannot consume currency
    incorrectly; max upgrades and reload behavior match displayed UI.

- [ ] **RA-019 - Implement explicit sandbox/debug options**
  - Dependency: RA-017, RA-018.
  - Free purchases, all weapons unlocked, unlimited-currency rule, invulnerability
    and seed control. Decide whether M toggles a public sandbox or dev-only flag.
  - Acceptance: unlimited mode never overflows; normal saves remain separate;
    disabling the mode restores normal rules and communicates the active mode.

- [ ] **RA-020 - Expand the approved arsenal**
  - Dependency: RA-014, RA-018, G2 approval.
  - Reach the agreed 8-12 original types, each with a distinct tested purpose.
    Candidate additions: poison, explosive, multi-shot, ricochet and heavy arrows.
  - Acceptance: effect interactions, pooled resets, friendly-fire policy and
    unlocked/equipped reload behavior tested for every type.

- [ ] **RA-021 - Expand enemies, arenas and wave progression**
  - Dependency: RA-012, RA-018, G2 approval.
  - Three approved enemy archetypes/arenas; wave composition and bounded scaling.
  - Acceptance: spawn points are valid, enemies remain reachable and unwinnable
    states do not occur during 50 seeded automated wave runs.

- [ ] **RA-022 - Balance the progression loop**
  - Dependency: RA-020, RA-021.
  - Define time-to-first-unlock and upgrade pacing with playtests, not arbitrary
    huge prices copied from the JavaScript experiment.
  - Acceptance: agreed 10-15 minute session has meaningful choices and no mandatory
    ad or payment; record progression distribution for the test group.
  - **G3:** sign off feature inventory and revise the remaining estimate.

## Phase 4: local modes, UX and release

- [ ] **RA-023 - Add local versus**
  - Dependency: RA-013, RA-016.
  - Separate control bindings, aim indicators, HUD and victory ownership.
  - Acceptance: simultaneous inputs do not cross-control actors; rematch resets
    both players, and keyboard/gamepad conflicts are documented.

- [ ] **RA-024 - Add local cooperative waves**
  - Dependency: RA-021, RA-023.
  - Explicit team, reward-sharing, revive/defeat and friendly-fire policies.
  - Acceptance: one player's defeat does not deadlock the surviving player;
    both-defeated and restart flows award no duplicate rewards.

- [ ] **RA-025 - Add touch/responsive/accessibility behavior**
  - Dependency: RA-015, RA-016.
  - Gesture ownership, safe areas, orientation changes, focus, reduced motion,
    readable contrast and alternative controls.
  - Acceptance: real-device iOS/Android solo tests; 320px layout has usable UI;
    no ghost release on rotation or interrupted touch. Local modes may remain
    desktop-only if clearly labeled and approved.

- [ ] **RA-026 - Profile and bound runtime work**
  - Dependency: RA-020, RA-021, RA-023, RA-024.
  - Pools, attachment/effect caps, UI update costs, allocations and Web memory.
  - Acceptance: normal/stress/frame-time and 20-reset memory targets pass using
    the recorded baseline device and build configuration.

- [ ] **RA-027 - Assemble regression automation and CI**
  - Dependency: RA-004, RA-017, RA-020.
  - Unity Edit/Play Mode suites, deterministic logic fixtures, Web smoke checks,
    licensed batch build, logs/artifacts and vanilla hash guard.
  - Acceptance: a deliberate broken fixture prevents publication; a clean clone
    builds with the pinned Editor using documented steps.
  - Unit fixtures are added with earlier features; this task wires full release
    orchestration, not a reason to postpone tests until the end.

- [ ] **RA-028 - Audit original assets and platform behavior**
  - Dependency: RA-022, RA-025, RA-026.
  - Asset license inventory, original branding, codec/loading errors, Chrome/
    Firefox/Safari testing, save persistence and no unexpected remote SDK calls.
  - Acceptance: approved checklist with browser/device versions and no unresolved
    release-blocking defects; test desktop systems beyond this Mac where needed.

- [ ] **RA-029 - Publish, document and prove rollback**
  - Dependency: RA-022, RA-024, RA-025, RA-026, RA-027, RA-028.
  - Preview deployment, relative paths, thumbnail/hub link, controls, version,
    build provenance and last-known-good deployment.
  - Acceptance: another person opens the public URL and completes a full session;
    rollback restores the previous artifact without touching saves or vanilla.
  - **G4:** initial release is accepted only with test evidence, not just a build.

## Definition of done for every implementation item

1. Source and serialized assets persist in version control with stable metadata.
2. Unity compilation passes; directly relevant tests cover the changed behavior.
3. No broad exception suppression, fake success notifications or guessed save keys.
4. Inspect the result in Editor and in Web for gameplay-facing changes.
5. Update relevant controls/data/build documentation.
6. Reference files and other game versions remain unchanged.
7. Record measured evidence and known limitations before marking the task complete.

## First implementation session

Only after user approval:

1. Resolve RA-001 decisions (Unity route, original name, scope and target devices).
2. Complete RA-002 with user-controlled license/install steps.
3. Create source/build foundations and get the blank Web player through G0.
4. Then spend the limited spike budget on RA-005 through RA-010.

Do not start a weapon shop or promise all unlocks before the ragdoll/Web proof.
