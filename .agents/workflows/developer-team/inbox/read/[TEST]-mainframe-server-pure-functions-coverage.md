# [TEST] mainframe/server — pure functions in clipFramesBody and clipCatalog lack direct unit tests

**From:** Test Marshal  
**Area:** `mainframe/server/clipFramesBody.js`, `mainframe/server/clipCatalog.js`  
**Date:** 2026-07-18  
**Tier:** unit (node)

## Summary

Two server modules contain pure functions with non-trivial logic that are only tested
indirectly via `server.test.js` integration tests (792 lines, real HTTP server). Direct
unit tests would isolate edge cases more effectively.

## Findings

### 1. `clipFramesBody.js` — `parseClipFramesBody()` and `decodeFrameDataUrls()` untested directly

`parseClipFramesBody()` (82 lines) parses clip create/update JSON bodies into
spritesheet options + frame buffers. `decodeFrameDataUrls()` strips data-URL prefixes
and decodes base64 to Buffers.

**Untested edge cases:**
- `decodeFrameDataUrls` with raw base64 (no data-URL prefix)
- `decodeFrameDataUrls` with mixed data-URL formats (png, jpeg, gif)
- `parseClipFramesBody` with null/undefined body
- `parseClipFramesBody` with empty frames array → `frameBuffers` should be null
- `parseClipFramesBody` with `frameDurations` → `frameRatesForFrames` conversion
- `parseClipFramesBody` with `frameBakeConfigs` as non-array → should be undefined
- `parseClipFramesBody` with all sync fields (`sync`, `syncLength`, `syncBeats`, `beatsPerBar`)

### 2. `clipCatalog.js` — `isPipelineReadyClip()` untested directly

`isPipelineReadyClip()` (lines 29-39) is a pure function that determines if a clip
folder has enough metadata + sprite to pass the pipeline. It checks:
- `hasSprite` and `meta` presence
- `meta.png` filename safety (`SAFE_PNG_NAME`)
- `meta.frames` (or `meta.numberOfFrames` legacy alias) is integer >= 1
- `meta.framesPerRow` is integer >= 1

**Untested edge cases:**
- `meta.numberOfFrames` (legacy alias) instead of `meta.frames`
- `meta.png` with path traversal attempt (e.g. `../evil.png`)
- `meta.frames` as float (should fail)
- `meta.framesPerRow` as 0 or negative (should fail)
- `meta` as null/undefined
- `hasSprite` as false

## Existing indirect coverage

Both functions are exercised via `server.test.js`:
- `parseClipFramesBody` via POST /api/clips and PUT /api/clips/:clipId/frames tests
- `isPipelineReadyClip` via GET /api/clips tests (pipelineReady field checked)

## Priority

**Low-Medium** — indirect coverage exists and is reasonably thorough. Direct unit tests
would improve edge case coverage and regression isolation, but the integration tests
already catch the main paths.
