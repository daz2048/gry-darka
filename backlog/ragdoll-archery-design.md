# Original ragdoll archery: scope and technical design

Status: proposed design; no Unity code or project generated yet.
See [assessment](./ragdoll-archery-assessment.md) for feasibility and estimates,
and [implementation backlog](./ragdoll-archery-backlog.md) for acceptance gates.

## Product goal and boundaries

Create an original browser game with satisfying active ragdoll archery, complete
rounds, varied arrows, enemy progression and local multiplayer. Every game-owned
component must be editable from committed C#, scenes, prefabs and data.

"Fully editable" does not mean rewriting Unity or guaranteeing every mechanic
from an unaudited reference. Unity, packages and browser capabilities remain
dependencies. Exact reference parity needs an inventory and explicit decisions.

Keep [Ragdoll Archers](../ragdoll-archers/) frozen. Do not modify its files,
storage or SDK integration. [Archers 0.4](../archers-0.4/) stays independently
playable; this proposal does not replace it.

### Scope ladder

| Stage | Included | Explicitly deferred |
|---|---|---|
| Technical proof | Jointed actors, active balance, bow/arrow hit, minimal duel, Web export | Shops, content catalogue, multiplayer, final art |
| Vertical slice | One arena, one enemy, three arrow types, complete loop, basic sound/UI | Large economy, bosses, touch-specific design |
| Initial release | Roughly 8-12 original arrow types, three enemy archetypes, three arenas, upgrades/saves, local versus/co-op, tested touch UX | Online multiplayer, accounts, ads, cloud saves |
| Later parity/polish | Additional content, challenge modifiers, cosmetics and refined feedback | Only after reference audit and measured demand |

Counts are scope proposals, not claims about the existing compiled game's content.
Re-estimate after the vertical slice; cut content before sacrificing stability.

## Proposed source and deployment layout

```text
unity-src/ragdoll-archery/       # Complete editable Unity project
  Assets/
    Game/
      Scripts/                 # Small components grouped by gameplay feature
      Data/                    # Balance/weapon/enemy ScriptableObjects
      Prefabs/                 # Actors, arrows, arena and UI
      Scenes/                  # Bootstrap, PhysicsSandbox, Duel
      Art/
      Audio/
    Editor/                    # Reproducible project setup and Web build methods
    Tests/
      EditMode/
      PlayMode/
  Packages/
  ProjectSettings/
ragdoll-unity-0.1/              # Generated browser export, not handwritten source
backlog/                       # Assessment, design and implementation backlog
```

Paths/naming are proposed. Do not create a replacement MX directory. Confirm names
before implementation. Include assembly definitions once there are meaningful
runtime/test boundaries; avoid speculative package layers.

Commit `Assets`, their `.meta` files, `Packages/manifest.json`, the package lock
and `ProjectSettings`, including `ProjectVersion.txt`. Exclude `Library`, `Temp`,
`Logs`, `Obj`, IDE caches and generated intermediate builds. Decide whether Web
exports live on a deployment branch or a Pages artifact before adding large builds.
Use Git LFS for large source assets only with an explicit hosting/build plan.
Do not require the browser to fetch LFS pointer files as game binaries.

## Engine and rendering

- Choose a supported Unity 6 LTS Apple-silicon Editor patch and pin it.
- C# and Unity 2D physics (`Rigidbody2D`, 2D colliders, `HingeJoint2D`).
- Orthographic camera and original flat 2D art.
- Start with a lightweight 2D project; avoid complex lighting/post-processing
  until the Web budget is measured. Select the render pipeline at setup.
- One input abstraction for pointer, keyboard, touch and local player ownership.
- Unity UI for menus/HUD; HTML wrapper only for loading, version and navigation.
- No custom engine, ECS conversion, networking framework or service container
  unless a concrete measured requirement appears.

## Active ragdoll

Initial actor: head, torso, pelvis, upper/lower arms and upper/lower legs,
approximately 11 dynamic bodies. Treat this as a testable starting point, not
a requirement to match the reference's skeleton.

1. Connect anatomical anchors with hinge joints and joint angle limits.
2. Disable connected-limb collisions where necessary; define terrain, actors,
   projectiles and sensors explicitly through collision layers.
3. Apply bounded motor/torque controllers toward target relative joint angles.
   Scale gains with timestep and inertia; avoid teleporting dynamic bodies.
4. Add torso/hip balance forces and grounded-foot support. Controllers must have
   configurable strength rather than unconditional upright correction.
5. Use living, aiming, stunned, falling and defeated states. On death disable
   active muscles but keep physical constraints.
6. Keep bow-hand targeting separate from balance. Aim motion must not inject
   unlimited energy or break shoulders.
7. Tune timestep, solver settings, mass ratios and collider geometry together.
8. Instrument joint error, body speed, torque saturation and invalid transforms.

Start at 60 physics steps/second and evaluate a higher rate only if needed.
Never use transform animation and dynamic physics to drive the same limb.
If the active system misses the stability gate after the allotted spike, simplify
the living controller and keep fully dynamic defeated bodies; report the
behavioral compromise explicitly before proceeding.

## Bow, projectile and damage

- Charge maps through configurable curves to release speed and stamina cost.
- Aim from the actual bow socket; preview uses the same launch/gravity model.
- Use body-part hit regions, owner immunity at release and a damage policy.
- Combine appropriate continuous collision settings with a swept cast from the
  previous arrow-tip position. Resolve the first valid hit once per impact.
- Attach stuck arrows in target-local space or through a controlled joint;
  cap attachments and their lifetime per actor.
- Pool projectiles and effects, including correct reset of ownership, statuses
  and hit identifiers. No stale damage when an object is reused.
- Damage is an explicit transaction: target, source, hit region, impulse,
  status effects and reward eligibility. A defeat awards currency exactly once.
- Use consistent units (meters/seconds), finite values and clamped tuning.
- Validate point-blank shots, maximum-speed shots, moving limbs, shields,
  rebounds and explosions before adding an arsenal.

## Data-driven content and easy modification

`WeaponDefinition`: stable ID, original presentation assets, unlock rule, price,
launch parameters, damage, effect parameters and pool limits.
`ActorDefinition`: masses, body geometry, joints, controller gains and health.
`EnemyDefinition`: aim error, firing cadence, movement choices and rewards.
`ArenaDefinition`: spawn sockets, platforms, bounds and camera framing.
`EconomyDefinition`: starting currency, reward curves, upgrade costs and caps.

Use ScriptableObjects for editor-authored configuration; keep runtime state out
of shared definition assets. Use small tested effect implementations for normal,
fire, frost, poison, multi-shot, explosive and other approved arrow concepts.
Do not create a universal visual scripting system just to tune a dozen weapons.

Changes such as "free arrows", "everything unlocked" and "start with lots of
currency" must be normal source/data edits, not binary patches:

- Sandbox configuration: `allWeaponsUnlocked`, `freePurchases`,
  `unlimitedCurrency`, invulnerability and repeatable test seeds.
- Unlimited currency is a separate rule, not IEEE infinity or an overflowing
  integer. Normal purchases use a validated bounded integer balance.
- Decide which shortcuts are public sandbox features and which are development
  only. Never silently mix sandbox progress with normal saves.

## AI, rounds and modes

State flow: boot -> menu -> round setup -> playing -> outcome -> next round/menu.
Pause, focus loss and restart must be explicit transitions with no duplicate
timers, pending shots or reward callbacks.

Enemy AI estimates a ballistic trajectory, adds bounded error/delay by difficulty
and respects the same stamina/weapon rules as a player. Fairness comes from
data, not hidden health/damage exceptions. Use repeatable seeds in test fixtures;
do not require bitwise deterministic physics across platforms.

Build solo survival first, local versus second, then cooperative waves.
Local players need distinct input ownership, HUD and aim indicators. Online
multiplayer is a separate project requiring networking/authority design.

## Progression and storage

Use a unique company/product identity and explicit save key namespace, unrelated
to the reference game's `data` save. Persist a versioned JSON schema:
currency, owned weapon IDs, equipped IDs, upgrades, achievements and settings.

- Validate IDs/ranges; unknown content does not silently unlock everything.
- Migrate old schemas through tested migrations.
- Back up the last valid save and show a useful recovery message on corruption.
- Handle denied storage/quota explicitly; offer an intentional temporary session.
- Provide export/import and a confirmed reset action.
- Test browser persistence through reload, closing/reopening and deployment at
  the real subpath. Web saves are not trusted anti-cheat storage.
- Do not add a backend, SDK, ad service or cloud account to the initial release.

## Audio, interface and accessibility

Original sound effects for charge, release, hit, defeat and UI; verify codecs in
Chrome, Safari and Firefox. Start/resume audio from a user gesture and handle
denied playback with visible diagnostics rather than suppressing all errors.

Responsive HUD and loading progress/error/retry screen; visible version badge.
Pointer capture/cancellation, keyboard focus, pause-on-blur, touch-safe controls,
mute, volume, reduced motion and distinguishable player colors. Browser zoom,
safe areas and screen rotation need explicit tests.

## Web build and GitHub Pages

1. Build the first blank Web player during setup, not at the end of development.
2. Use single-threaded Web output initially; avoid dependence on custom
   cross-origin-isolation headers on GitHub Pages.
3. For static hosting choose uncompressed output initially, or compression with
   Unity's decompression fallback. Verify MIME handling and actual hosted load;
   do not assume the server can set custom Content-Encoding headers.
4. Keep template paths relative to `/gry-darka/ragdoll-unity-0.1/`.
5. Use a user-initiated entry point for audio/fullscreen.
6. No localhost references in production assets; the existing local server only
   serves files for development. It is not a game backend.
7. Build through a committed Editor method, for example
   `GameBuild.BuildWeb`, after that method exists. Pin build settings and scenes.
8. Run batch compilation/tests/builds with the selected Editor; collect logs and
   fail publication on errors. Add CI only after local license/build success.
9. Publish to a preview path, smoke-test it, then add a hub card and thumbnail.
10. Keep reference hashes unchanged. Never publish over the vanilla directory.

## Initial measurable targets

Targets are provisional budgets, not observed performance. Record the exact Mac,
browser versions, display scale and power mode when measuring; adjust only through
an explicit scope/performance decision.

| Area | Target |
|---|---|
| Ragdoll stability | Two living actors, 10 minutes, no NaN/infinite transform, no detached joint or unexplained fall |
| Joint error | Under 5% of torso length at rest and under 15% for more than two consecutive physics steps after impacts |
| High-speed hits | 1,000 controlled swept-shot fixtures at maximum configured speed, no missed expected intersection or duplicate damage |
| Complete loop | 20 win/loss/restart cycles without stuck state or duplicate rewards |
| Normal Web performance | 60 fps target at 1280x720; p95 frame time <=20 ms over a 5-minute run on the chosen Mac browser baseline |
| Stress performance | Four actors, 100 live projectiles and 30 effects; p95 <=33 ms, bounded pool/object counts |
| Memory | After warm-up, no monotonic growth across 20 round resets; post-cleanup memory within 10% of baseline using consistent measurement |
| Loading | Initial compressed download target <=30 MB; interactive within 15 s on a defined 25 Mbps/50 ms test profile |
| Saves | Reload/migration/corruption/reset fixtures pass; vanilla save unchanged |
| Mobile (later gate) | 30 fps target and usable controls on named real iOS/Android devices; not just desktop emulation |

Expected physical falls caused by intentionally leaving a platform are not a
stability failure. Specify supported impulse limits and fixture poses before
running stability tests; do not demand stability against arbitrary infinite force.
