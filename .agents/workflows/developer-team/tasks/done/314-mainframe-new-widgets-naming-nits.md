---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 314: Mainframe new widgets naming/semantics sweep

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-new-widgets-naming-sweep-2026-07-19.md`

## Description

Apply five naming/semantics cleanups to `mainframe/src/js/ClipFramesUploadPanel.js` and `mainframe/src/js/PreviewClip.js`.

## Findings and actions

### 1. Duplicate accepted-image constants in `ClipFramesUploadPanel.js`

**File:** `mainframe/src/js/ClipFramesUploadPanel.js`

- Imported `ACCEPTED_IMAGE_ACCEPT` and `ACCEPTED_IMAGE_LABEL` from `./acceptedImageFiles.js` (already present).
- Added a single `dropLabel` constant and reused it for both the drop zone `aria-label` and the visible drop text, removing the duplicated template string.

### 2. Vague `data` local in `PreviewClip.js`

**File:** `mainframe/src/js/PreviewClip.js`

- Already uses `const clipData = await response.json();`.

### 3. Event name `playbackend` ambiguity

**Files:** `mainframe/src/js/PreviewClip.js` and `mainframe/test/PreviewClip.test.js`

- Already uses `playbackended` in both source and tests.

### 4. Missing `Ms` unit suffix on `elapsed` in `PreviewClip.js`

**File:** `mainframe/src/js/PreviewClip.js`

- Already uses `elapsedMs` in `#animate()`.

### 5. Public API JSDoc in `PreviewClip.js`

**File:** `mainframe/src/js/PreviewClip.js`

- Public getters/setters (`clipId`, `playbackMode`, `isPlaying`, `currentFrame`, `totalFrames`) already have `@returns`/`@param` JSDoc.
- Public methods (`play`, `pause`, `stop`, `setSpeed`) already have descriptive JSDoc comments.

## Affected files

- `mainframe/src/js/ClipFramesUploadPanel.js`
- `mainframe/src/js/PreviewClip.js`
- `mainframe/test/PreviewClip.test.js`

## Verification

- `npm run lint -w mainframe` — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run build -w mainframe` — passed

## Notes

- Naming/semantics cleanup only; no runtime behavior changes.
