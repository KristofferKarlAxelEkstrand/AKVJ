---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 306: Mainframe server `clipCatalog.js` error and edge path tests

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/[TEST]-mainframe-server-clipCatalog-error-paths.md`

## Description

Add unit tests to `mainframe/test/clipCatalog.test.js` for the currently untested functions and error/edge branches in `mainframe/server/clipCatalog.js`.

## Functions and branches to cover

### `readClipDirectories`
- Returns `[]` when `projectClipsDir(projectId)` does not exist (`ENOENT`).
- Returns only directories, ignoring files at the clips root.

### `readClipMeta`
- Returns parsed `meta.json` when valid.
- Returns `{}` when `meta.json` is missing.
- Returns `{}` when `meta.json` contains invalid JSON.

### `checkSpriteExists`
- Returns `true` when `meta.png` points to an existing sprite.
- Returns `false` when the sprite file is missing (both default `sprite.png` and explicit `meta.png`).
- Returns `false` when `meta.png` contains path traversal (`../evil.png`) or a subdirectory (`subdir/sprite.png`) (`!SAFE_PNG_NAME.test`).

### `listClips`
- Returns only valid pipeline-ready clips in a sorted array.
- Ignores entries that are not directories or have invalid clip IDs.
- Handles a missing clips root gracefully (empty array).

### `readyClipIdSet`
- Returns a `Set` of only `clipId`s whose `pipelineReady` is `true`.

## Affected files

- `mainframe/test/clipCatalog.test.js`
- `mainframe/server/clipCatalog.js` (read-only unless tests expose a real bug)

## Verification

- `npm run test -w mainframe` passes.
- `npm run lint` passes.
- New tests exercise the listed branches without source changes unless a real bug is found.

## Notes

- Unit tier, node environment. No source behavior changes intended.
