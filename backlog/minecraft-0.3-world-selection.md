# Minecraft 0.3 — World Selection

## Goal

Let players keep multiple named worlds in the same browser profile, choose a
world when they enter Minecraft 0.3, and create another world without replacing
their existing build.

## Current state

**Status: Multi-world storage, picker, and lifecycle management implemented;
documentation and final verification are in progress.**

Before this work, Minecraft 0.3 loaded one IndexedDB `current` record and
retained one `previous` record for recovery. The catalog now keeps separate
world records and recovery copies, and the entry overlay lists, creates,
selects, renames, and deletes worlds. Saves remain local to the current browser
profile and site.

## Product and data decisions

- Keep all worlds local to the same IndexedDB database and browser origin.
- Use the existing immutable `worldId` as identity; names are labels and need
  not be unique.
- Keep a full snapshot and revision/conflict checking per world. Preserve one
  previous valid snapshot per world for recovery.
- A new world gets a distinct ID and seed. Creating one must not replace or
  mutate another world.
- Show a picker on entry when saved worlds exist. Offer **Continue** for the
  most recently used world, plus **Play** for each listed world and **New
  world**. With no saved worlds, guide the player directly to world creation.
- Let players rename and delete worlds. Deletion requires explicit confirmation;
  deleting the last world returns to the empty-state/new-world flow.
- Show world name and last-saved time in the list. Keep the existing 32-character
  name limit and EN/PL localization.
- Do not add cloud sync or export/import in this feature.
- Preserve the current save and recovery copy during migration. If the two
  records have different IDs, surface both as worlds; if IDs match, retain the
  older record as that world's recovery copy. Never silently discard malformed
  legacy records or overwrite populated multi-world data.

## Incremental implementation plan

| Step | Scope | Acceptance criteria | Status |
| --- | --- | --- | --- |
| 0 | Record this plan, decisions, and baseline. | Plan is saved in `backlog/`; current save flow and tests are identified; baseline is 59 passing tests. | **Complete** |
| 1 | Evolve `WorldSaveStore` to a multi-world catalog with per-world save, load, recovery, rename, and delete operations. Add safe migration from `current`/`previous` slots and legacy 0.4 records. | Focused storage tests prove two IDs remain isolated; each has its own revision/backup; mutations are atomic; legacy data is preserved or migrated without loss; conflict/corruption failures remain explicit. | **Complete** |
| 2 | Add a localized, accessible world picker and empty state to the entry overlay. | Existing worlds can be listed and selected; the recent-world shortcut works; no-world state leads to creation; the overlay scrolls when its content exceeds the viewport. | **Complete** |
| 3 | Integrate per-world lifecycle and management. | New creates a separate world; autosave/manual save target only the selected ID; rename and confirmed delete update the catalog; selecting another world restores its player, materials, and settings. | **Complete** |
| 4 | Update user/developer documentation and complete validation. | README describes multiple local worlds and migration; EN/PL keys and tests pass; browser checks cover common world flows, while storage tests cover migration, recovery, corruption, and failure paths. | **Complete** |

## Detailed execution notes

### Step 1 — storage contract and migration

1. Keep snapshot validation and transaction-based save semantics; scope expected
   revisions by `worldId`.
2. Introduce a catalog operation that returns validated worlds ordered by
   recent use, plus explicit states for damaged records so the UI can report
   them rather than pretending the catalog is empty.
3. Store the recovery generation alongside its world, and ensure a failed save
   leaves both generations intact.
4. Migrate the current 0.3 `current` and `previous` keys idempotently. Reuse
   the existing 0.4 migration path, then migrate its resulting slot records.
   Preserve corrupt markers and do not overwrite a populated target catalog.
5. Extend the fake IndexedDB only for schema/transaction behavior required by
   these tests; cover empty catalog, distinct IDs, same-ID backup, rename,
   delete, conflicts, corruption, interrupted migration, and retry.

### Step 2 — picker

1. Add a list panel that reuses the start overlay and existing visual language.
2. Render names as text (not HTML), provide accessible labels and button state,
   and localize all new visible/accessible strings in English and Polish.
3. Keep the current control-mode choices after selecting a world; do not capture
   the mouse until the player explicitly chooses a play mode.
4. Preserve save status, recovery, and migration errors with distinct copy and
   recovery actions; never present a storage failure as an empty catalog.
5. Localize the list, management controls, and confirmations in both English
   and Polish.

### Step 3 — lifecycle

1. Track selected `worldId` in the active game state and snapshot.
2. Flush pending edits before switching, and prevent switching while a save is
   unresolved or a cross-tab conflict is pending.
3. Make new-world creation independent of existing world records and select the
   newly created world only after its initial save succeeds.
4. Confirm deletion with the world name, delete the selected world's backup
   atomically, then select another saved world or show the empty state.
5. Confirm rename and last-played ordering persist after reload.

### Step 4 — verification and docs

1. Run `npm test` from `klocki-podlasia-0.3/`.
2. Verify browser flows: first and second worlds, selection, create and reload,
   rename, deletion, empty state, and cancellation. Use storage tests for
   migration, recovery, corruption, storage denial, and save conflicts.
3. Update the Minecraft 0.3 README and this plan's status/work log with what
   shipped, test evidence, and any remaining limitations.

## Progress log

- 2026-11-13: Plan drafted from the existing single-slot save behavior and
  reviewed storage tests. Baseline `npm test` from `klocki-podlasia-0.3/`
  passed all 59 tests. The save layer and migration are the first implementation
  increment; picker and lifecycle wiring remain later steps.
- 2026-11-13: Storage catalog, per-world revisions/backups, migration of the
  former slots, recent-world metadata, and rename/delete operations are
  implemented. Focused storage tests and the complete 64-test suite pass.
- 2026-11-13: Fixed the management-confirmation markup required by the picker
  handlers. Browser checks on the isolated `127.0.0.1` origin verified app
  startup, two-world listing and selection, English/Polish labels, rename,
  confirmed deletion, last-world empty state, creation from empty, and reload
  persistence. The README now describes the catalog and migration. The final
  64-test suite covers migration, recovery, corruption, quota failure, storage
  denial, save conflicts, and interrupted operations; syntax and whitespace
  checks pass.
