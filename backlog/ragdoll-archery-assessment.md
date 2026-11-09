# Editable ragdoll archery: feasibility and assessment

Assessment date: 2026-11-09.

## Short answer

**Yes: we can build our own fully editable ragdoll archery game on this Mac.**
The practical route is to use Unity's engine and create our own C# gameplay,
prefabs, scenes, art, sound and data. We do not need to recreate the Unity engine.

Reaching the general quality and breadth of a mature reference game is a
multi-month project, not a few webpage edits. The hardest part is making physical
characters feel good while remaining controllable, stable and fast in a browser.
There is no verified basis for promising exact feature-for-feature parity yet.

Copilot can implement substantial parts of the project, write tests and build
automation, and help iterate on bugs. It cannot replace Unity Editor execution,
human playtesting, art direction, licensing decisions or acceptance of game feel.

## What "our own engine" means

| Route | What we own/edit | Assessment |
|---|---|---|
| Modify the existing compiled Unity game | Wrapper; internal changes only through fragile investigation/patches | Not a sustainable foundation for complete editability |
| Continue [Archers 0.4](../archers-0.4/) in Phaser/Matter | JavaScript gameplay and page; framework remains a dependency | Lowest setup cost; valid if browser iteration matters more than learning Unity |
| New original game in Unity | All game source, scenes, assets, tuning, UI, progression and build pipeline | Recommended for a Unity-based project with editor tooling |
| Write a new engine comparable to Unity | Renderer, physics integration, editor, import pipeline, platform tooling and more | Far beyond this game's scope; potentially years of separate work |

Using Unity does not mean owning Unity's proprietary engine source. It means
owning and editing our game without reverse engineering someone else's binary.

## Existing repository: what helps and what does not

- [Ragdoll Archers](../ragdoll-archers/) contains a playable compiled Web build,
  not the original Unity project. Keep it frozen as a behavior reference.
- [Archers 0.4](../archers-0.4/) contains readable JavaScript, a weapon catalogue,
  charging, rounds, upgrades and a Phaser/Matter integration. These are useful
  design experiments, not C# or Unity assets we can import unchanged.
- Its current weapon values are not automatically a balanced economy for the new
  game. Reassess them instead of copying everything into the initial milestone.
- The repository already has a menu, static hosting and a local HTTP server.
  Reuse deployment conventions, not shared mutable gameplay files.
- The reference's internal implementation is unknown. A similar-looking result
  does not require the same implementation.

## Can this Mac do all the work?

### Observed here

- Apple silicon (`arm64`) and macOS 27.2.
- Unity Hub and the Editor were not found in their standard `/Applications`
  locations. This does not rule out a custom installation elsewhere.
- `dotnet` was not on the shell PATH at assessment time. Unity supplies its own
  managed toolchain; VS Code C# tooling requirements should be checked separately.
- RAM, free disk space, thermal behavior and installed Xcode tooling have not been
  assessed. Do not interpret CPU architecture alone as a performance certification.

### Recommended setup

1. Install Unity Hub; sign in and activate an eligible license.
2. Select a supported Unity 6 LTS patch with an Apple-silicon Editor and **Web
   Build Support**. Verify that exact patch works on the installed macOS release.
   The linked Unity 6.0 documentation establishes platform capabilities, not a
   recommendation to install that particular release today.
3. Install any Rosetta/toolchain components required by that Editor's release
   notes. Unity's current system-requirements documentation lists Rosetta 2 for
   Apple-silicon setups; do not assume every tool is native.
4. Configure Unity's VS Code integration, C# language support and debugging.
5. Enable version control metadata and text serialization. Commit `.meta` files.
6. Make an empty scene, run it in the Editor, and export a Web build immediately.
7. Test the export via localhost and the actual GitHub Pages subpath.

Planning recommendations, not measured requirements: **16 GB RAM is comfortable
for this scale; 32 GB gives more room for Editor/browser/IDE together.** Unity
documents a minimum recommendation of 8 GB. Reserve roughly **30-60 GB free SSD
space** for tooling, caches, imports and builds, then measure actual usage.

This Mac can author C#, create 2D art/audio, run Editor tests, and produce Web
and macOS builds without a Windows PC. Native iOS distribution adds Xcode,
signing, Apple requirements and device testing; native Android adds its SDK/NDK
and device testing. Neither is needed for the initial browser game. Testing
Windows browsers and real mobile hardware still needs access to those platforms.

## How much work?

Assumptions: one experienced developer using Copilot, original/simple 2D art,
single-player first, no backend or online multiplayer, Unity already chosen, and
small testable milestones. Hours include implementation and targeted validation,
not just generating code. They are estimates, not measured repository tasks.

| Workstream | Person-hours |
|---|---:|
| Tooling, original scope, project/build foundations | 12-24 |
| Active-ragdoll and Web feasibility spike | 40-90 |
| Reliable bow, projectiles, impacts and damage | 45-90 |
| Complete duel, AI, rounds and feedback | 50-100 |
| Versioned saves, economy, unlocks and development controls | 45-90 |
| Weapon/enemy/arena content and presentation | 65-140 |
| Local multiplayer, responsive/touch UX and accessibility pass | 55-110 |
| Profiling, browser regression, deployment and release hardening | 55-110 |
| **Initial feature-rich release subtotal** | **367-754** |

Add **25-40% contingency** for physics tuning, browser differences and integration:
approximately **460-1,060 person-hours**. This assumes the bounded release scope
in the design document, not a pixel-perfect reconstruction of every reference
feature. Network multiplayer, cloud accounts, monetization and large campaigns
are excluded.

Useful budget checkpoints, all cumulative rather than additive:

- **Technical proof:** about 50-115 hours before deciding whether to continue.
- **Fun single-player vertical slice:** about 150-300 hours including rework.
- **Feature-rich initial release:** about 460-1,060 hours with contingency.
- **Mature polish/content breadth comparable to the reference:** provisionally
  900-1,800+ hours total, subject to the feature audit. This range has lower
  confidence because the reference's complete feature set is not inventoried.

At 15 productive hours/week, 460-1,060 hours means roughly **7-16 months**.
At 30 productive hours/week, roughly **4-8 months**. Calendar time can grow with
interruptions, feedback and asset production. Someone learning Unity/C# should
allow roughly 1.5-2.5 times the relevant estimate, especially early on.
Do not treat AI-generated code volume as evidence that these totals disappear.

## What Copilot can do, and what you still do

| Activity | Copilot contribution | Required human/tool involvement |
|---|---|---|
| Gameplay | C# components, data assets, UI controllers, effects and fixes | Run in Editor/browser and approve behavior |
| Prefabs/scenes | Editor scripts that create repeatable fixtures and prefabs | Inspect results, composition and serialized references |
| Testing | Pure-logic, Edit Mode, Play Mode and browser smoke tests | Choose test hardware; judge fun and visual defects |
| Builds | Editor build methods, scripts and CI configuration | Install/activate Unity; approve credentials and publishing |
| Art/audio | Procedural placeholders, import settings and integration | Create/license final assets; judge quality |
| Tuning | Parameterized experiments, instrumentation and comparisons | Aim feel, balance and difficulty decisions |

Preferred collaboration loop: one bounded feature -> compilation -> automated
tests -> Editor play -> Web build -> human feedback. Never accept "done" solely
because a script was generated. Copilot in VS Code does not inherently have a
Unity Editor control bridge; use Editor automation and CLI where available,
and explicit human steps where not.

A separate standalone .NET SDK is not a substitute for testing Unity APIs and
serialization in the actual Editor. Unity installation and license activation
require user participation. No installation is performed by this planning task.

## Costs and ownership

- Unity Personal currently advertises eligibility below USD 200,000 in revenue
  and funds raised during the last 12 months. Verify current terms and the
  applicable entity's eligibility before starting; this is not legal advice.
- Potential costs: licensed art/audio/fonts, test devices, optional CI capacity
  and distribution accounts. Paid assets are not required for the first spike.
- Create original source and assets or use dependencies with verified licenses.
  Do not assume the reference repository's MIT notice establishes rights to all
  third-party artwork, sound or branding.
- Use a distinct working/product name. Similar game mechanics are the reference,
  not a request to reproduce copyrighted assets, menus or branding.

## Principal risks and mitigation

| Risk | Mitigation / stop condition |
|---|---|
| Ragdolls wobble, explode or fight aiming | Physics sandbox first; fixed timestep, sensible mass ratios, bounded torque and joints |
| Fast arrows tunnel or damage twice | Swept collision, impact identity and maximum-speed automated fixtures |
| Browser build much slower than Editor | Export in the first milestone; profile real Web player throughout |
| Audio/loading regressions | Test fresh browser profiles, user-gesture audio and failure paths; do not mask exceptions |
| Save collisions with other versions | Unique product identity, dedicated save namespace and versioned schema |
| Feature creep before core feel | Gate shops, large arsenals and multiplayer on a fun vertical slice |
| Reference accidentally changes | Separate source/build folders; baseline hash guard before releases |
| CI blocked by licensing | Validate local batch builds first; add hosted automation only after activation is understood |

## Recommendation and first decision

Fund only the **50-115 hour physics/Web proof** initially. Stop at a stable
ragdoll, reliable shot, complete small duel and working deployed Web build.
Playtest it before committing to the full content budget.

If low-friction browser editing is the main priority, improving Archers 0.4 in
Phaser remains a legitimate cheaper alternative. Choosing Unity is worthwhile
for its editor workflow and ecosystem, not a prerequisite for editable weapons.

## Sources checked

Official pages consulted on 2026-11-09; recheck when choosing the Editor:

- [Unity system requirements](https://docs.unity3d.com/6000.0/Documentation/Manual/system-requirements.html)
- [Unity Web browser compatibility](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-browsercompatibility.html)
- [Web deployment and decompression fallback](https://docs.unity3d.com/6000.0/Documentation/Manual/webgl-deploying.html)
- [Hinge Joint 2D reference](https://docs.unity3d.com/6000.0/Documentation/Manual/2d-physics/joints/hinge-joint-2d-reference.html)
- [Editor command-line arguments](https://docs.unity3d.com/6000.0/Documentation/Manual/EditorCommandLineArguments.html)
- [Unity Personal eligibility](https://unity.com/products/unity-personal)
