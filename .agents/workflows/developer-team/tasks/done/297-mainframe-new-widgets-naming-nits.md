---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 297: Mainframe new widgets naming/semantics nits

## Source

Nitpicker sweep: `.agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-new-widgets-naming-sweep-2026-07-19.md`

## Description

Apply naming and semantics cleanup to the new `ClipFramesUploadPanel.js` and `PreviewClip.js` widgets and their tests. This is a non-behavioral readability pass.

## Findings

### 1. `ClipFramesUploadPanel.js` duplicates accepted-image constants
- **File**: `mainframe/src/js/ClipFramesUploadPanel.js` (lines 36, 40, 46)
- **Current**:
  - `fileInput.accept = 'image/png,image/jpeg,image/gif,.png,.jpg,.jpeg,.gif';`
  - `dropZone.setAttribute('aria-label', 'Drop PNG, JPG, or GIF frames here or click to browse');`
  - `dropText.textContent = 'Drop PNG, JPG, or GIF frames here or click to browse';`
- **Proposed**: Import `ACCEPTED_IMAGE_ACCEPT` and `ACCEPTED_IMAGE_LABEL` from `./acceptedImageFiles.js` and use them to build the accept string and label.
- **Rationale**: Central `acceptedImageFiles.js` already owns the MIME/extension accept string and the human label. Duplicating them risks stale copy and drift with validation.

### 2. `PreviewClip.js` vague `data` local for the frames response
- **File**: `mainframe/src/js/PreviewClip.js` (line 235)
- **Current**: `const data = await response.json();`
- **Proposed**: `const clipData = await response.json();` (or `framesResponse`)
- **Rationale**: `data` is too generic; the endpoint returns clip frame URLs and durations. A domain name matches prior cleanup of `const data` in `ClipEditorController.js`.

### 3. `PreviewClip.js` event name `playbackend` reads as "playback backend"
- **File**: `mainframe/src/js/PreviewClip.js` (lines 17, 342) and `mainframe/test/PreviewClip.test.js` (lines 124, 142)
- **Current**: `new CustomEvent('playbackend', ...)` plus `@fires PreviewClip#playbackend`
- **Proposed**: `new CustomEvent('playbackended', ...)` (or `ended`) and update JSDoc/tests
- **Rationale**: `playbackend` is a compound with no separator and is easily misread as a server/backend concept. Past-tense `playbackended` clearly signals that playback has finished.

### 4. `PreviewClip.js` `elapsed` duration is missing `Ms` unit suffix
- **File**: `mainframe/src/js/PreviewClip.js` (line 317)
- **Current**: `const elapsed = timestamp - this.#lastTimestamp;`
- **Proposed**: `const elapsedMs = timestamp - this.#lastTimestamp;`
- **Rationale**: `timestamp` is from `requestAnimationFrame` and is in milliseconds, so `elapsed` is a millisecond duration. The `Ms` suffix matches the codebase unit-honesty convention.

### 5. `PreviewClip.js` public API lacks JSDoc
- **File**: `mainframe/src/js/PreviewClip.js`
- **Current**: public getters/setters (`clipId`, `playbackMode`, `isPlaying`, `currentFrame`, `totalFrames`) and methods (`play()`, `pause()`, `stop()`, `setSpeed(multiplier)`) have no JSDoc.
- **Proposed**: add standard `/** @param */` / `/** @returns */` blocks for each public getter/setter/method, following the class-level event JSDoc style.
- **Rationale**: `code-standards.md` requires JSDoc for public-facing API methods to provide IDE intellisense without TypeScript.

## Affected files

- `mainframe/src/js/ClipFramesUploadPanel.js`
- `mainframe/src/js/PreviewClip.js`
- `mainframe/test/PreviewClip.test.js`

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npm run build -w mainframe` passes.
4. No runtime behavior changes.

## Notes

- These are naming/semantics nits only; do not change behavior.
