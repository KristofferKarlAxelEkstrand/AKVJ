---
status: done
assignee: akvj-developer
priority: high
---

# Task 169: mainframe ClipEditorController submit/hydrate/GIF + playbackUtils + apiClient Test Coverage (Test Marshal Sweep 3)

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-editor-coverage.md`
(Test Marshal — coverage gaps in `mainframe/src/js/`).

## Scope

### 1. ClipEditorController.submit() — all three branches (HIGH PRIORITY)
**File:** `mainframe/src/js/ClipEditorController.js` (lines 336–446)
**Existing tests:** 0 submit tests in `ClipEditorController.test.js`

Cases to add:
- Create (POST /clips): new clip with staged files → POST, verifies `onLibraryChanged`, `#editingClipId` set, `#router.replace` called
- Create with empty clip ID: error "Clip ID is required", no API call
- Create with zero staged files: error "Cannot save with zero frames", no API call
- Frames PUT (editing + dirty): PUT `/clips/{id}/frames`, verifies `#framesDirty` reset
- Frames PUT (editing + size/scale changed): PUT `/clips/{id}/frames`
- Meta-only PUT (editing + clean): PUT `/clips/{id}` with meta patch, no frames in body
- Submit error handling: API non-ok → `#reportOutcome('error', ...)`
- Extended fields error: `#readExtendedEditorFields()` returns `{ error }` → submit aborts
- Post-submit state update: `#loadedFrameWidth`/`#loadedFrameHeight`/`#loadedScaleMode` updated

### 2. ClipEditorController — hydrate success path (MEDIUM)
Cases to add:
- Hydrate success: fetch returns `{ frames, durationsMs, meta, source }` → form populated, `#editingClipId` set, clip ID readonly, button text "Save"
- Hydrate with sprite source: `clipFrames.loadFrames` called correctly
- Hydrate sets loaded frame dimensions
- Hydrate generation guard: stale response ignored

### 3. ClipEditorController — GIF expansion path (MEDIUM)
Cases to add:
- GIF expansion success: POST `/expand-gif` → animated → multiple frames with durations
- GIF expansion non-animated: falls through to normal staging
- GIF expansion API error: error reported, no frames staged

### 4. playbackUtils.js — dedicated test file (MEDIUM)
**File:** `mainframe/src/js/playbackUtils.js` (no existing test file)

Cases to add:
- `ShuffleState`: `next()` range, reshuffle after full cycle, `reset()`, single-frame
- `PingpongState`: forward/reverse bounce, `reset()`, single-frame
- `advanceFrame`: all modes (reverse, random, shuffle, once, pingpong, loop, scrub, default)

### 5. apiClient.js — dedicated test file (LOW)
**File:** `mainframe/src/js/apiClient.js` (no existing test file)

Cases to add:
- Successful response: returns parsed JSON
- Non-ok with `{ error }`: throws `Error(error)`
- Non-ok unparseable: throws `Error("HTTP {status}")`
- Request includes `Content-Type: application/json`
- Custom headers merged with defaults

## Note from Test Marshal
Item 4 (`playbackUtils.js`) contains the same `ShuffleState`/`PingpongState`/`advanceFrame`
logic extracted into `akvj/src/js/visuals/PlaybackController.js` — both copies are untested.
Consider whether these should share a single module (but that's a separate task).

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/ClipEditorController.test.js` (existing — add submit/hydrate/GIF cases)
- `mainframe/test/playbackUtils.test.js` (new)
- `mainframe/test/apiClient.test.js` (new)
- `mainframe/src/js/ClipEditorController.js` (reference only)
- `mainframe/src/js/playbackUtils.js` (reference only)
- `mainframe/src/js/apiClient.js` (reference only)
