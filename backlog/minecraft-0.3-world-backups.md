# Minecraft 0.3 - portable world backups

## Goal and scope

Download a single world as a self-contained file and restore that file in the
same or another browser profile/site. Browser recovery copies are not external
backups. This feature follows the completed multi-world picker work; it does not
change its migration, revision, or recovery semantics.

No cloud sync, automatic downloads, replace-existing import, ZIP compression,
all-world archive, or compatibility promises for other game versions.

## Data contract

- UTF-8 JSON, format marker `minecraft-world-backup`, backup format version 1.
- Envelope contains export time, a snapshot, and a SHA-256 checksum of the
  canonical snapshot JSON (fixed field order). The checksum detects accidental
  corruption, not authenticity.
- Snapshot includes save schema/generator versions, dimensions, seed, world
  ID/name, complete block/water arrays encoded as canonical Base64, player
  position/orientation, selected material, and settings. Do not copy IndexedDB
  revisions or recovery generations.
- Explicitly select recognized fields; never spread untrusted JSON into storage.
  Reuse `validateSnapshot` after decoding. Reject unsupported formats/versions,
  bad checksum, invalid cells/player/settings, truncated data, and malformed
  Base64. Check exact encoded/decoded lengths before allocating large buffers.
- Current arrays total 4 MiB; Base64 totals about 5.33 MiB plus metadata.
  Reject files above 8 MiB before reading and bound metadata before checksumming.
  SHA-256 uses Web Crypto (HTTPS/localhost required), with an explicit error
  when unavailable. No dependencies or network upload.

## UX and persistence

- Add Export to each valid world card and Import to the picker (including its
  empty state). Pause -> Choose world exposes these actions.
- For the active world, await pending saves and flush unsaved changes before
  exporting. Never silently export an older record after save failure/conflict.
  Non-active worlds export their validated current record, not recovery data.
- Download a safely sanitized, timestamped `.minecraft-world.json` filename.
  Report that the download was requested, not that the user saved it to disk.
  Release object URLs after the browser has had time to start the download.
- Import via a single-file picker; cancellation changes nothing. Validate fully
  before writing. Always use a new UUID, keep the name (duplicates allowed), and
  create revision 1 through the existing atomic save transaction.
- Enforce the existing 10-world cap both in the UI and transaction. Quota,
  unavailable storage, and concurrent capacity changes must leave existing worlds
  and recovery copies intact. Failed imports must not switch the active session.
- Serialize transfer actions and disable competing picker/management/play actions
  during transfers. Keep the current session selected after import; list the new
  world for explicit selection. Preserve the active-world metadata in storage.
- Provide persistent transfer status/errors, accessible labels, and EN/PL copy.
  Explain that only supported Minecraft 0.3 backups can be restored.

## Execution and acceptance

| Step | Work | Evidence required | Status |
| --- | --- | --- | --- |
| 1 | Branch, plan, initial PR | Clean starting tree; baseline tests; PR links plan | Complete |
| 2 | Codec and import storage operation | Exact snapshot round trip; rejection of malformed/incompatible/checksum-invalid files; fresh IDs/revisions; atomic quota/capacity failure | Complete |
| 3 | Picker integration and localization | Latest active edits exported; repeat import never overwrites; cancel is harmless; no false disk-save success; controls serialize work | Complete |
| 4 | Docs and verification | Full logic suite, syntax/whitespace checks, browser download/upload/reload, EN/PL and failure paths; update PR | Complete |

## Verification log

- Baseline: all 77 Minecraft 0.3 Node tests pass on 2026-11-13.
- 2026-11-13: Implemented the codec in `backups.js`, new-ID import through the
  existing atomic storage transaction, and EN/PL picker controls. Existing save
  behavior remains the default; only imports suppress active-world selection.
  Import errors distinguish file size, incompatible format, invalid data,
  checksum mismatch, and missing Web Crypto. Post-commit list-refresh failures
  explicitly report that import succeeded and a reload is needed.
- Final `npm test --prefix klocki-podlasia-0.3`: all **87 tests pass** (77 baseline,
  8 codec/file tests, 2 storage-import tests). JavaScript syntax checks and
  `git diff --check` pass. No compilation or dependency installation is needed.
- Headless Chromium **158.0.8127.18**, isolated temporary browser contexts:
  actual download (5,592,936 bytes in the final run), file-picker upload, repeated
  import with fresh IDs/revision 1, exact block/water/player/settings restoration,
  retained active world, reload persistence, and restore into a separate empty
  browser profile all passed. Restored world selection enables play.
- Browser failure checks passed for cancellation, malformed JSON, incompatible
  format, checksum corruption, files above 8 MiB, missing Web Crypto, and a
  post-commit list refresh failure. Failed saves and cross-tab conflicts prevent
  stale downloads. A suspended in-progress save followed by another setting
  change is fully flushed before export; competing picker controls stay disabled.
  The 10-world cap disables import while leaving export available.
- EN/PL controls and persistent error text update correctly when switching
  language; the error detail originally remained in English and was fixed during
  browser verification. Updated all shared i18n imports, including the diagnostics
  test, together. The picker has no horizontal overflow at 480 px.
- Limits: verification was local headless Chromium, not a hosted/standalone Chrome
  release certification. Checksum is integrity detection, not authentication.
  No ZIP/bulk backup, cloud sync, or cross-version converter was added.
