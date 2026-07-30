---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 180: Direct Unit Tests for clipFramesBody.js and clipCatalog.js Pure Functions

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-server-pure-functions-coverage.md`
(Test Marshal — pure functions with only indirect integration coverage).

## Scope

### 1. clipFramesBody.js — parseClipFramesBody() and decodeFrameDataUrls() (LOW-MEDIUM)
Cases to add:
- `decodeFrameDataUrls` with raw base64 (no data-URL prefix)
- `decodeFrameDataUrls` with mixed data-URL formats (png, jpeg, gif)
- `parseClipFramesBody` with null/undefined body
- `parseClipFramesBody` with empty frames array → `frameBuffers` should be null
- `parseClipFramesBody` with `frameDurations` → `frameRatesForFrames` conversion
- `parseClipFramesBody` with `frameBakeConfigs` as non-array → should be undefined
- `parseClipFramesBody` with all sync fields (`sync`, `syncLength`, `syncBeats`, `beatsPerBar`)

### 2. clipCatalog.js — isPipelineReadyClip() (LOW-MEDIUM)
Cases to add:
- `meta.numberOfFrames` (legacy alias) instead of `meta.frames`
- `meta.png` with path traversal attempt (e.g. `../evil.png`)
- `meta.frames` as float (should fail)
- `meta.framesPerRow` as 0 or negative (should fail)
- `meta` as null/undefined
- `hasSprite` as false

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/clipFramesBody.test.js` (new)
- `mainframe/test/clipCatalog.test.js` (new)
- `mainframe/server/clipFramesBody.js` (reference)
- `mainframe/server/clipCatalog.js` (reference)
