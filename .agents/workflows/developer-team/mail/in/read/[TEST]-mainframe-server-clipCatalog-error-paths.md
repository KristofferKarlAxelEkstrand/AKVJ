# [TEST] Mainframe server `clipCatalog.js` error and edge paths

Area: `mainframe/server/pipeline` — special mission: error-path check

Sweep date: 2026-07-19

## Module

`mainframe/server/clipCatalog.js` (113 lines)

## Finding

Only `isPipelineReadyClip()` has a direct unit test (`mainframe/test/clipCatalog.test.js`). The rest of the module — `listClips`, `readClipDirectories`, `readClipMeta`, `checkSpriteExists`, `readyClipIdSet`, `activeProjectId`, and `clipsRootFor` — has **no direct coverage**. The HTTP-level `server.test.js` exercises `listClips` on a healthy fixture, but the error/edge branches below are not asserted:

1. `readClipDirectories()` returns `[]` when the project clips directory does not exist (`ENOENT` branch).
2. `readClipMeta()` swallows **all** read/parse errors and returns `{}` — malformed `meta.json` is silently treated as an empty object. This is an explicit error-handling behavior with no test.
3. `checkSpriteExists()` returns `false` when `meta.png` contains path traversal or a subdirectory (`!SAFE_PNG_NAME.test`).
4. `checkSpriteExists()` falls back to `sprite.png` when `meta.png` is missing/undefined and the file does not exist.
5. `listClips()` filters out non-directory entries and invalid clip IDs before building clip entries.
6. `listClips()` sorts the final clip array by `clipId`.
7. `readyClipIdSet()` filters to clips where `pipelineReady` is `true`.

## Why it matters

`readClipMeta()` silently returning `{}` for corrupt `meta.json` means a broken clip can appear in the catalog as a valid entry with `pipelineReady: false` rather than surfacing an error. The HTTP tests do not verify this silent fallback, so a regression that throws instead of swallowing (or vice versa) would not be caught at the unit tier.

## Suggested test cases (unit tier, node environment)

- `readClipDirectories`
  - Returns an empty array when `projectClipsDir(projectId)` does not exist.
  - Returns only directories (ignores files at the clips root).
- `readClipMeta`
  - Returns parsed `meta.json` when valid.
  - Returns `{}` when `meta.json` is missing.
  - Returns `{}` when `meta.json` contains invalid JSON.
- `checkSpriteExists`
  - Returns `true` when `meta.png` points to an existing sprite.
  - Returns `false` when the sprite file is missing (default `sprite.png` and explicit `meta.png`).
  - Returns `false` when `meta.png` contains path traversal (`../evil.png`) or a subdirectory (`subdir/sprite.png`).
- `listClips`
  - Returns only valid pipeline-ready clips in a sorted array.
  - Ignores entries that are not directories or have invalid clip IDs.
  - Handles a missing clips root gracefully (empty array).
- `readyClipIdSet`
  - Returns a `Set` of only `clipId`s whose `pipelineReady` is `true`.

## Tier

Unit (`mainframe/test/clipCatalog.test.js`). No source changes needed.
