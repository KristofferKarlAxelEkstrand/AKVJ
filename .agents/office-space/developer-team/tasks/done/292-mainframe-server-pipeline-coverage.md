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

# Task 292: Add mainframe server/pipeline test coverage

## Description

The mainframe unit suite is green, but two clusters of server/pipeline logic have thin or no direct regression coverage: the shared spritesheet compositor (`lib/spritesheet-core.js`) and several error/edge branches in the clip HTTP handlers.

## 1. `mainframe/scripts/clips/lib/spritesheet-core.js` — missing direct unit tests

Add node-based unit tests for the following helpers (used by both `server/spritesheet.js` and `scripts/clips/spritesheet.js`):
- `resolveTargetDimensions` — defaults to 240×135 for missing/non-integer/non-positive values; respects valid overrides.
- `resolveFrameRate` — defaults to 12 for missing/non-finite/non-positive values.
- `resolvePlayback` — defaults to `'loop'` for missing/non-string/empty values.
- `resolveFramesPerRow` — returns 1 for 0/negative/missing counts; caps at `maxFramesPerRow`.
- `normalizeFrameBuffers` — decodes PNG/JPG/GIF to PNG with alpha (GIF uses `page: 0`).
- `assertReadableFrames` — throws `Could not read frame dimensions` for corrupt/unreadable buffers.
- `resizeFrames` — accepts a shared `scaleMode` string and a per-frame `frameBakeConfig[]` array, dispatching each frame to `fitFrameBuffer` with the right config.
- `fitFrameBuffer` branches:
  - `stretch` fills the cell exactly.
  - `fit` letterboxes with transparent background and honors placement offsets.
  - `cover` crops to fill and honors placement offsets.
  - `none` centers native-sized content, crops if larger than cell, applies placement.
  - `custom` resizes to explicit width/height then places.
- `fitNone` — crops oversized sources to the target center; passes smaller sources through.
- `compositeContentOntoCell` — positive placement offsets, zero offset passthrough, fully-off-cell transparent fallback, `contentIsFullCell=true`, unreadable-content error.
- `buildComposites` — lays out frames in rows with correct `left`/`top` for counts under and over `maxFramesPerRow` cap.
- `renderSpriteSheet` — creates sheet with dimensions `width * framesPerRow` × `height * rows` and composites all inputs.

**Suggested file:** `mainframe/test/spritesheet-core.test.js` (or extend `frameBake.test.js` and rename).

## 2. `mainframe/server/handlers/clips.js` — untested error branches

Add integration/unit tests (node environment) for:
- `serveSprite` returns 404 with a descriptive message when the sprite PNG is missing (`ENOENT` branch).
- `serveSprite` falls back to `'sprite.png'` when `meta.png` is missing.
- `handlePutClipMeta` returns 400 when `png` is updated to an invalid/traversing filename (`SAFE_PNG_NAME` guard).
- `handlePutClipMeta` returns 400 when `meta.json` is invalid JSON.
- `handlePutClipMeta` returns 404/400 when the clip directory's `meta.json` is missing or unreadable.
- `handleGetClipFrames` returns 404 for a clip that does not exist.
- `handlePutClipFrames` returns 404 for a clip that does not exist.
- `handleRecompileClip` reads `scaleMode` from existing `meta.json` when request body omits it.
- `handleRecompileClip` converts `frameDurations` to `frameRatesForFrames` and applies them.

## 3. `mainframe/server/handlers/misc.js` — expand-gif input variants

Add integration tests (node) for `POST /api/expand-gif`:
- `handleExpandGif` accepts `body.gif` and `body.data` as aliases for `body.image`.
- `handleExpandGif` rejects an empty/whitespace-only base64 string.
- `handleExpandGif` returns 400 when `expandGifBuffer` throws.

## Affected files

- New: `mainframe/test/spritesheet-core.test.js`
- `mainframe/test/server.test.js` (or new handler-specific test files)
- `mainframe/scripts/clips/lib/spritesheet-core.js` (read-only unless tests expose a real bug)
- `mainframe/server/handlers/clips.js` (read-only unless tests expose a real bug)
- `mainframe/server/handlers/misc.js` (read-only unless tests expose a real bug)

## Verification

1. `npm run test -w mainframe` passes.
2. `npm run lint` passes.
3. New tests cover the listed spritesheet helpers and handler branches.

## Notes

- Unit + integration tests, node environment, no browser needed.
- Do not refactor source code unless a real bug is exposed by the tests.
