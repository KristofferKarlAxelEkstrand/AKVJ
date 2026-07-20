# [NIT] Mainframe new widgets naming/semantics sweep

Area: `mainframe/src/js/` new stable files (`ClipFramesUploadPanel.js`, `PreviewClip.js`) plus `mainframe/test/PreviewClip.test.js` / `mainframe/test/ClipFramesUploadPanel.test.js` (tests checked, clean)

## Findings

### 1. `ClipFramesUploadPanel.js` duplicates accepted-image constants already in `acceptedImageFiles.js`
- **File**: `mainframe/src/js/ClipFramesUploadPanel.js` (lines 36, 40, 46)
- **Current**:
  - `fileInput.accept = 'image/png,image/jpeg,image/gif,.png,.jpg,.jpeg,.gif';`
  - `dropZone.setAttribute('aria-label', 'Drop PNG, JPG, or GIF frames here or click to browse');`
  - `dropText.textContent = 'Drop PNG, JPG, or GIF frames here or click to browse';`
- **Proposed**:
  - Import `ACCEPTED_IMAGE_ACCEPT` and `ACCEPTED_IMAGE_LABEL` from `./acceptedImageFiles.js`.
  - `fileInput.accept = ACCEPTED_IMAGE_ACCEPT;`
  - `const dropLabel = \`Drop ${ACCEPTED_IMAGE_LABEL} frames here or click to browse\`;`
  - Use `dropLabel` for both `aria-label` and `dropText.textContent`.
- **Rationale**: Central `acceptedImageFiles.js` already owns the MIME/extension accept string and the human label. Duplicating them here risks stale copy and drift with validation. It also removes two long magic strings from the render method.

### 2. `PreviewClip.js` vague `data` local for the frames response
- **File**: `mainframe/src/js/PreviewClip.js` (line 235)
- **Current**: `const data = await response.json();`
- **Proposed**: `const clipData = await response.json();` (or `framesResponse`)
- **Rationale**: `data` is too generic; the endpoint returns clip frame URLs and durations. A domain name (`clipData` / `framesResponse`) makes the shape obvious and matches prior cleanup of `const data` in `ClipEditorController.js`.

### 3. `PreviewClip.js` event name `playbackend` reads as "playback backend"
- **File**: `mainframe/src/js/PreviewClip.js` (lines 17, 342) and `mainframe/test/PreviewClip.test.js` (lines 124, 142)
- **Current**: `new CustomEvent('playbackend', ...)` plus `@fires PreviewClip#playbackend`
- **Proposed**: `new CustomEvent('playbackended', ...)` (or `ended`) and update JSDoc/tests
- **Rationale**: `playbackend` is a compound with no separator and is easily misread as a server/backend concept. Past-tense `playbackended` clearly signals that playback has finished.

### 4. `PreviewClip.js` `elapsed` duration is missing `Ms` unit suffix
- **File**: `mainframe/src/js/PreviewClip.js` (line 317)
- **Current**: `const elapsed = timestamp - this.#lastTimestamp;`
- **Proposed**: `const elapsedMs = timestamp - this.#lastTimestamp;`
- **Rationale**: `timestamp` is from `requestAnimationFrame` and is in milliseconds, so `elapsed` is a millisecond duration. The `Ms` suffix matches the codebase unit-honesty convention (`durationsMs`, `FALLBACK_MS`, `frameDurationsMs`).

### 5. `PreviewClip.js` public API lacks JSDoc
- **File**: `mainframe/src/js/PreviewClip.js`
- **Current**: public getters/setters (`clipId`, `playbackMode`, `isPlaying`, `currentFrame`, `totalFrames`) and methods (`play()`, `pause()`, `stop()`, `setSpeed(multiplier)`) have no JSDoc.
- **Proposed**: add standard `/** @param */` / `/** @returns */` blocks for each public getter/setter/method, following the class-level event JSDoc style.
- **Rationale**: `code-standards.md` requires JSDoc for public-facing API methods to provide IDE intellisense without TypeScript. `PreviewClip` is a reusable custom element with a clear public surface; documenting it makes consumption easier.

## Celebrations

- `ClipFramesUploadPanel.js` is admirably small and focused: no state, a clean `connectedCallback`/`disconnectedCallback` pair, and light-DOM composition. The `clip-frames-upload-panel` / `preview-clip` tag names follow the unprefixed leaf-widget rule.
- `PreviewClip.js` uses excellent descriptive private fields (`#durationsMs`, `#shuffleState`, `#pingpongState`) and honest unit naming (`FALLBACK_MS`, `DEFAULT_FRAME_*` imports, `ms`-based timing).
- `acceptedImageFiles.js` is a great central source of truth for upload acceptance; wiring `ClipFramesUploadPanel.js` into it will make the panel even more maintainable.
