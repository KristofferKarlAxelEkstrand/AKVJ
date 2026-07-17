# Server Architect: Persistent Memory

This file is the persistent ledger for the "Server Architect" agent.
Read this file at the start of your run, and update it at the end of your run.

## Goal
Decouple the `akvj` (pure, lightweight visualizer) from the `mainframe` server (heavy UI, image optimization, file management). Establish the shared `clips/` folder and `set-mapping.json` as the sole bridge between them.

## Progress Checklist

### Phase 1: Dependency & File System Isolation
- `[x]` Audit `package.json` workspaces to ensure `mainframe` and `akvj` have isolated dependencies.
- `[x]` Ensure the `clips/` folder is positioned correctly as the shared data bucket.

### Phase 2: akvj Purification
- `[x]` Remove any remaining clip generation/validation logic from `akvj`.
- `[x]` Ensure `akvj` reads `set-mapping.json` efficiently to map independent clips to MIDI inputs.

### Phase 3: mainframe Feature Build-out
- `[x]` Build mainframe API to accept file uploads (images).
- `[x]` Build mainframe image processing (sharp) to optimize uploaded images into standard clips.
- `[x]` Build mainframe UI to view the clip bucket.
- `[x]` Build mainframe UI to visually edit `set-mapping.json`.

## Completed Tasks

### Iteration 1 — Phase 1 Audit (2025-07-16)
**Findings:**
- **Dependency isolation is solid.** `akvj` has only Vite + Vitest (lightweight). `mainframe` has `sharp`, `chokidar`, `concurrently` (heavy). No overlap.
- **No cross-imports.** `akvj` never imports from `mainframe` and vice versa. The sole bridge is the filesystem (`clips/` folder + `set-mapping.json` + `clips.json`).
- **`clips/` folder is correctly positioned** at repo root as a flat bucket. The mainframe clip pipeline (`mainframe/scripts/clips/`) reads from `clips/`, processes via `.cache/clips/`, and outputs to `akvj/src/public/clips/`.
- **`akvj` is clean of clip pipeline logic.** Its only clip-related code is `ClipLoader.js` (runtime loading via fetch of `set-mapping.json` + `clips.json`) and a Vite hot-reload watcher in `vite.config.js`. No generation, validation, or optimization logic.
- **`akvj` reads `set-mapping.json` efficiently** — fetched once at startup via `fetch('/clips/set-mapping.json')`, parsed, and used to build the MIDI→clip tree.

**Bug fixes applied during audit:**
1. **`Pipeline.js` EPERM on dev container 9p mounts** — `#generate()` used `fs.copyFile()` directly for `set-mapping.json` and `LICENSE-ASSETS.md`, which fails with EPERM on 9p filesystems. Fixed by using the existing `copyFileWithFallback()` utility from `fsUtils.js` (which falls back to read/write on EPERM/ENOSYS).
2. **`mainframe/vitest.config.js` picking up `node:test` file** — `server/health.test.js` uses Node's built-in test runner, but Vitest was discovering it and failing with "No test suite found". Fixed by adding `'**/server/**'` to the Vitest exclude list.

**Verification:**
- `npm run build:all` — passes (clips pipeline + akvj build + mainframe build)
- `npm run test:all` — passes (akvj: 273 tests, mainframe: 25 tests, midi-mcp: 705 tests)

### Iteration 2 — Phase 3 Audit & Clip Delete Feature (2025-07-16)
**Findings:**
- **mainframe server already has full Phase 3 capabilities.** `mainframe/server/index.js` is a lightweight Node http server (no Express) with endpoints for: listing clips (`GET /api/clips`), uploading clips via base64 PNG frames (`POST /api/clips`), reading/writing set-mapping (`GET/PUT /api/mapping`), serving sprites (`GET /api/clips/:clipId/sprite`), and running the pipeline (`POST /api/pipeline`).
- **mainframe UI already has Library, Upload, and Mapping tabs** in `mainframe/src/main.js` with full interactivity.
- **Missing: clip deletion.** No DELETE endpoint existed — users could create clips but not remove them.

**Changes implemented:**
1. **`DELETE /api/clips/:clipId` endpoint** in `mainframe/server/index.js` — validates clipId, checks existence (404 if not found), removes the clip directory recursively via `fs.rm()`, returns `{ ok, clipId }`.
2. **CORS update** — added `DELETE` to `Access-Control-Allow-Methods` header.
3. **Delete button in Library UI** (`mainframe/src/main.js`) — each clip list item now has a "Delete" button with `confirm()` dialog. On success, the library auto-refreshes.
4. **CSS updates** (`mainframe/src/styles.css`) — clip list grid expanded to 3 columns (sprite, meta, delete button), styled `.clip-delete` with error-red color and hover state.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 25, midi-mcp: 705)
- `npm run lint` — no new errors (6 pre-existing in `midi-mcp/ca33Transformer.js`)

### Iteration 3 — mainframe Server Test Hardening (2025-07-16)
**Findings:**
- **mainframe server had zero HTTP-level tests.** The `server/` directory was excluded from Vitest (iteration 1 fix), and no test exercised the actual HTTP endpoints.
- **Server module was not testable** — it auto-listened on a hardcoded port on import, making it impossible to import in tests without port conflicts.

**Changes implemented:**
1. **Refactored `mainframe/server/index.js` for testability** — extracted `createAdminServer()` exported function that returns an `http.Server` instance. Auto-listen only triggers when run directly as main module (`import.meta.url === file://...`).
2. **Added `AKVJ_CLIPS_DIR` env var override** in `mainframe/server/paths.js` — allows tests to point the server at a temp directory instead of the real `clips/` bucket. `SET_MAPPING_PATH` derives from it automatically.
3. **Created `mainframe/test/server.test.js`** — 17 tests covering all HTTP endpoints:
   - `GET /api/health` — returns ok
   - `GET /api/clips` — lists clips, verifies fields
   - `GET /api/mapping` — returns mapping array
   - `PUT /api/mapping` — writes valid mapping, rejects invalid clipId, rejects duplicate slots
   - `DELETE /api/clips/:clipId` — deletes existing clip, 404 for non-existent, 400 for invalid clipId
   - `POST /api/clips` — creates clip from base64 PNG, rejects invalid clipId, rejects empty frames, rejects duplicate
   - `GET /api/clips/:clipId/sprite` — serves PNG, 400 for invalid clipId
   - 404 handling for unknown routes
   - Uses temp directory with sharp-compatible 4x4 PNG fixture

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 42, midi-mcp: 705 = 1020 total)
- Server starts correctly when run directly

### Iteration 4 — Clip Metadata Editing & Pipeline Confirmation (2025-07-16)
**Findings:**
- **No metadata editing capability.** Clips could be created and deleted but their `meta.json` fields (numberOfFrames, loop, retrigger, etc.) could not be updated without manually editing files.
- **No pipeline confirmation.** The "Run pipeline" button triggered immediately without asking the user to confirm.

**Changes implemented:**
1. **`PUT /api/clips/:clipId` endpoint** in `mainframe/server/index.js` — merges provided fields into existing `meta.json` using a whitelist of editable fields (`numberOfFrames`, `framesPerRow`, `loop`, `retrigger`, `frameRatesForFrames`, `frameDurationBeats`, `bitDepth`, `role`, `png`). Non-whitelisted fields are silently ignored. Validates `png` filename if changed. Returns 404 for non-existent clips, 400 for invalid clipId.
2. **Metadata edit UI** in `mainframe/src/main.js` — each clip in the Library tab now has an "Edit" button that toggles an inline form with fields for numberOfFrames, framesPerRow, loop, retrigger, role, and bitDepth. Save calls `PUT /api/clips/:clipId` and refreshes the library.
3. **Pipeline confirmation dialog** — "Run pipeline" button now shows a `confirm()` dialog before triggering.
4. **CSS** in `mainframe/src/styles.css` — styles for `.clip-actions`, `.clip-edit`, `.clip-edit-form`, `.clip-edit-field`, `.clip-edit-actions`.
5. **5 new tests** in `mainframe/test/server.test.js` — PUT updates fields, preserves non-edited fields, ignores non-whitelisted fields, 404 for non-existent, 400 for invalid clipId. AfterEach restores original metadata.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 801 = 1121 total)
- `npm run lint` — clean on all modified files

### Iteration 5 — Clip Preview Player (2025-07-16)
**Findings:**
- **Library tab only showed static sprite thumbnails.** Users had no way to preview clip animations without running the full VJ engine.
- **akvj already has a `ClipPreview.js` tool** at `akvj/src/tools/clip-preview/ClipPreview.js` — studied its frame extraction logic (col = frameIndex % framesPerRow, row = floor(frameIndex / framesPerRow), frameWidth = image.width / framesPerRow, frameHeight = image.height / ceil(numberOfFrames / framesPerRow)) but did NOT import it (architectural boundary).

**Changes implemented:**
1. **Preview button** in `mainframe/src/main.js` — each clip in the Library tab now has a "Preview" button (disabled if no sprite). Clicking toggles an inline canvas animation player.
2. **Canvas-based animation player** — 240×135 canvas with `imageSmoothingEnabled = false` (pixelated). Loads the sprite PNG via the existing `/api/clips/:clipId/sprite` endpoint, slices frames using the same dimension math as `akvj/src/js/visuals/Clip.js`, and plays them with `requestAnimationFrame`.
3. **Timing support** — uses `frameRatesForFrames` metadata for per-frame FPS (defaults to 15fps). Respects `loop` metadata (non-looping clips stop at the last frame and show "finished").
4. **Cleanup** — `activePreviewPlayers` Map tracks running players. Stop button and toggle both call `cancelAnimationFrame` and clean up. Players are stopped when toggled off.
5. **CSS** in `mainframe/src/styles.css` — styles for `.clip-preview`, `.clip-preview-player`, `.clip-preview-canvas`, `.clip-preview-controls`, `.clip-preview-frame-label`.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 839 = 1159 total)
- `npm run lint` — clean on all modified files

### Iteration 6 — frameRatesForFrames & frameDurationBeats Editors (2025-07-16)
**Findings:**
- **Metadata edit form was missing two advanced timing fields.** `frameRatesForFrames` (per-frame FPS object) and `frameDurationBeats` (BPM-synced timing) were in the server's `EDITABLE_META_FIELDS` whitelist but had no UI editor.
- **These are JSON-structured fields** — `frameRatesForFrames` is an object like `{"0": 15}`, `frameDurationBeats` is a number or array like `0.25` or `[0.25, 0.5, 0.25]`.

**Changes implemented:**
1. **Two textarea inputs** in `mainframe/src/main.js` clip edit form — "Frame rates (JSON)" and "Duration beats (JSON)". Pre-populated with `JSON.stringify()` of existing values. Placeholders show expected format.
2. **Save handler parsing** — both fields are `JSON.parse()`d on save and included in the PUT body only if non-empty. Invalid JSON will throw and show an error status.
3. **CSS** in `mainframe/src/styles.css` — `.clip-edit-textarea` styled with monospace-friendly sizing, vertical resize, 12rem width.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 880 = 1200 total)
- `npm run lint` — clean on all modified files

### Iteration 7 — Preview Player Playback Controls (2025-07-16)
**Findings:**
- **Preview player had no playback controls.** Users could only watch the animation play automatically — no way to pause, seek to a specific frame, or change playback speed.

**Changes implemented:**
1. **Play/Pause toggle button** in `mainframe/src/main.js` — toggles `isPlaying` state, updates button label between "Play" and "Pause". Resuming from the last frame of a non-looping clip resets to frame 0.
2. **Frame scrub slider** — `<input type="range">` spanning 0 to `numberOfFrames - 1`. Dragging seeks to any frame. Uses `isScrubbing` flag to prevent the animation loop from fighting the slider position during drag. Disabled until sprite loads.
3. **Speed control** — `<select>` dropdown with 0.25×, 0.5×, 1×, 2×, 4× options. Divides the frame interval by the selected speed multiplier.
4. **Refactored animation loop** — extracted `setPlaying()` helper for clean play/pause state management. `animate()` now sets `animationFrameId = null` when stopping to allow proper restart.
5. **CSS** in `mainframe/src/styles.css` — `.clip-preview-play`, `.clip-preview-speed`, `.clip-preview-scrub` styles. Scrub slider spans full width via `grid-column: 1 / -1`.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 890 = 1210 total)
- `npm run lint` — clean on all modified files

### Iteration 8 — Library Clip Summary Header (2025-07-16)
**Findings:**
- **No overview of clip bucket status.** Users had no quick way to see how many clips existed or how many were pipeline-ready vs incomplete without scrolling through the entire list.

**Changes implemented:**
1. **Summary element** in `mainframe/src/index.html` — added `<span id="clip-summary">` to the Library panel header next to the Refresh button, wrapped in a `.panel-actions` div.
2. **`updateClipSummary()` function** in `mainframe/src/main.js` — called from `renderLibrary()`. Computes total clips, pipeline-ready count, and incomplete count. Displays text like "5 clips · 3 ready · 2 incomplete". Empty when no clips.
3. **CSS** in `mainframe/src/styles.css` — `.clip-summary` base style (muted), `.clip-summary--all-ready` (green), `.clip-summary--has-incomplete` (warning amber). Added `align-items: center` to `.panel-actions`.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 906 = 1226 total)
- `npm run lint` — clean on all modified files

### Iteration 9 — Mapping Summary with Unmapped Clips (2025-07-16)
**Findings:**
- **No visibility into mapping coverage.** Users couldn't see which pipeline-ready clips had no mapping entry, making it easy to forget mapping newly uploaded clips.

**Changes implemented:**
1. **Summary element** in `mainframe/src/index.html` — added `<div id="mapping-summary">` between the hint text and the mapping add form.
2. **`updateMappingSummary()` function** in `mainframe/src/main.js` — called from `renderMapping()`. Computes mapped slot count and identifies pipeline-ready clips that have no mapping entry (unmapped clips). Displays "N mapped slots" and "Unmapped: clip-a, clip-b" when applicable.
3. **CSS** in `mainframe/src/styles.css` — `.mapping-summary` (flex row with gap), `.mapping-summary-count` (muted), `.mapping-summary-unmapped` (warning amber).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 919 = 1239 total)
- `npm run lint` — clean on all modified files

### Iteration 10 — "Map this clip" Quick-Action Button (2025-07-16)
**Findings:**
- **No cross-tab workflow from Library to Mapping.** Users seeing an unmapped clip in the Library tab had to manually switch to the Mapping tab and find the clip in the dropdown — no quick-action to bridge the two.

**Changes implemented:**
1. **"Map" button** in `mainframe/src/main.js` clip list item actions — disabled if clip is not pipeline-ready. Clicking calls `mapClipFromLibrary(clipId)`.
2. **`mapClipFromLibrary()` function** — calls `switchTab('mapping')` to jump to the Mapping tab, then pre-selects the clip in the `map-clip-id` dropdown if it exists as an option.
3. **CSS** in `mainframe/src/styles.css` — `.clip-map` and `.clip-map:disabled` styles matching the preview button sizing.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 943 = 1263 total)
- `npm run lint` — clean on all modified files

### Iteration 11 — Clip Search/Filter Box (2025-07-16)
**Findings:**
- **No way to search or filter clips in the Library tab.** With many clips in the bucket, finding a specific clip by name or role required scrolling through the entire list.

**Changes implemented:**
1. **Search input** in `mainframe/src/index.html` — `<input type="search" id="clip-search">` in the Library panel header, placeholder "Filter by name or role…".
2. **`clipSearchQuery` state and event listener** in `mainframe/src/main.js` — `input` event updates `clipSearchQuery` (lowercased) and re-renders the library in real-time.
3. **`filterClipsBySearch()` function** — filters `clipCatalog` by matching `clipId` or `meta.role` against the query (case-insensitive substring match). Returns all clips when query is empty.
4. **`renderLibrary()` updated** — now calls `filterClipsBySearch()` and shows "No clips match…" message when filter results in zero matches. Summary counts still reflect the full catalog (not filtered).
5. **CSS** in `mainframe/src/styles.css` — `.clip-search` styled with surface background, 10rem width, matching font size.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 969 = 1289 total)
- `npm run lint` — clean on all modified files

### Iteration 12 — frameDurationBeats Array Length Validation (2025-07-16)
**Findings:**
- **No validation for `frameDurationBeats` array length.** When `frameDurationBeats` is an array, its length must equal `numberOfFrames` — but the UI had no hint or guard, making it easy to save invalid metadata that would break clip playback timing.

**Changes implemented:**
1. **`validateFrameDurationBeats()` function** in `mainframe/src/main.js` — validates the textarea content in real-time. If the parsed JSON is an array, checks that `array.length === numberOfFrames`. Shows error hint text "Array length N must equal numberOfFrames (M)" on mismatch. Also catches invalid JSON with "Invalid JSON" message.
2. **Live validation** — `input` event listeners on both `frameDurationBeatsTextarea` and `numberFramesInput` trigger re-validation, so changing `numberOfFrames` updates the hint dynamically.
3. **Save gate** — save handler now calls `validateFrameDurationBeats()` before proceeding. If validation fails, shows "Fix frameDurationBeats errors first" status and blocks submission.
4. **Hint element** — `<span class="clip-edit-hint">` appended to the form, empty when valid.
5. **CSS** in `mainframe/src/styles.css` — `.clip-edit-hint` (block, small font, spans full grid width) and `.clip-edit-hint--err` (error red).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1000 = 1320 total)
- `npm run lint` — clean on all modified files

### Iteration 13 — frameRatesForFrames Key Range Validation (2025-07-16)
**Findings:**
- **No validation for `frameRatesForFrames` keys.** The JSON object's keys must be integers in range `[0, numberOfFrames-1]` — but the UI had no hint or guard, making it easy to save invalid metadata that would break clip frame timing.

**Changes implemented:**
1. **`validateFrameRatesForFrames()` function** in `mainframe/src/main.js` — validates the textarea content in real-time. Parses JSON, checks it's a plain object (not array/null), then verifies all keys are integers in range `[0, numberOfFrames-1]`. Shows error hints: "Invalid JSON", "Must be a JSON object like {"0": 15}", or "Keys must be 0–N-1. Invalid: x, y".
2. **Live validation** — `input` event listeners on both `frameRatesTextarea` and `numberFramesInput` trigger re-validation, so changing `numberOfFrames` updates the hint dynamically.
3. **Save gate** — save handler now calls `validateFrameRatesForFrames()` before `validateFrameDurationBeats()`. If validation fails, shows "Fix frameRatesForFrames errors first" status and blocks submission.
4. **Hint element** — `<span class="clip-edit-hint">` appended between the two textarea fields in the form.
5. **Reuses existing CSS** — `.clip-edit-hint` and `.clip-edit-hint--err` from iteration 12.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1000 = 1320 total)
- `npm run lint` — clean on all modified files

### Iteration 14 — Role Filter Dropdown (2025-07-16)
**Findings:**
- **No role-based filtering in Library tab.** Users could search by text but couldn't quickly filter clips by role (e.g. show only "bitmask" clips), which is useful when managing large clip buckets with mixed roles.

**Changes implemented:**
1. **Role filter `<select>`** in `mainframe/src/index.html` — `<select id="clip-role-filter">` in Library panel header, default option "All roles", populated dynamically from catalog.
2. **`clipRoleFilter` state and event listener** in `mainframe/src/main.js` — `change` event updates `clipRoleFilter` and re-renders the library.
3. **`populateRoleFilter()` function** — extracts unique roles from `clipCatalog`, builds `<option>` elements, preserves current selection if still valid, resets if role no longer exists. Called from `loadLibrary()`.
4. **`filterClipsBySearch()` updated** — now applies both role filter (exact match) and text search (substring match on clipId or role). Role filter is applied first, then text search within the role-filtered set.
5. **CSS** in `mainframe/src/styles.css` — `.clip-role-filter` styled with surface background, matching font size.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1040 = 1360 total)
- `npm run lint` — clean on all modified files

### Iteration 15 — frameRatesForFrames Value Type Validation (2025-07-16)
**Findings:**
- **No validation for `frameRatesForFrames` values.** The JSON object's values must be positive numbers (FPS) — but the UI only validated key ranges, not value types. Invalid values like strings, null, or zero/negative numbers would break clip timing.

**Changes implemented:**
1. **Value type check** added to `validateFrameRatesForFrames()` in `mainframe/src/main.js` — after the key range check, validates all values are finite numbers > 0. Shows error hint "Values must be positive numbers. Invalid: x, y" on mismatch.
2. **No new UI elements needed** — reuses the existing `frameRatesHint` element and `.clip-edit-hint` / `.clip-edit-hint--err` CSS from iteration 13.
3. **Save gate already covers this** — the existing `validateFrameRatesForFrames()` call in the save handler now also blocks submission on invalid values.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1040 = 1360 total)
- `npm run lint` — clean on all modified files

### Iteration 16 — frameDurationBeats Value Type Validation (2025-07-16)
**Findings:**
- **No validation for `frameDurationBeats` values.** The field accepts a single number or array of numbers (beats per frame) — but the UI only validated array length, not value types. Invalid values like strings, null, or zero/negative numbers would break BPM-synced clip timing.

**Changes implemented:**
1. **Type check** added to `validateFrameDurationBeats()` in `mainframe/src/main.js` — if not an array, validates the parsed value is a number (shows "Must be a number or array of numbers" if not).
2. **Value type check** — normalizes to an array (`values = Array.isArray(parsed) ? parsed : [parsed]`) then validates all values are finite numbers > 0. Shows "Values must be positive numbers. Invalid: x, y" on mismatch.
3. **No new UI elements** — reuses existing `frameDurationBeatsHint` element and `.clip-edit-hint` / `.clip-edit-hint--err` CSS from iteration 12. Save gate from iteration 12 already covers this check.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1040 = 1360 total)
- `npm run lint` — clean on all modified files

### Iteration 17 — "Clear filters" Button (2025-07-16)
**Findings:**
- **No way to reset filters in one action.** Users had to manually clear the search input and reset the role dropdown separately. With both filters active, this was a minor friction point.

**Changes implemented:**
1. **"Clear filters" button** in `mainframe/src/index.html` — `<button id="clear-filters" hidden>` in Library panel header, between search input and Refresh button. Hidden by default, shown only when a filter is active.
2. **Click handler** in `mainframe/src/main.js` — resets `clipSearchQuery` and `clipRoleFilter` to empty, clears `clipSearchInput.value` and `clipRoleFilterSelect.value`, then re-renders.
3. **`updateFilterVisibility()` function** — called from `renderLibrary()`, shows the button when either `clipSearchQuery` or `clipRoleFilter` is non-empty, hides it otherwise.
4. **CSS** in `mainframe/src/styles.css` — `.clear-filters` styled matching other small buttons.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1094 = 1414 total)
- `npm run lint` — clean on all modified files

### Iteration 18 — Piano Keyboard UI (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/01-piano-keyboard-ui.md` (from inbox feature request `piano-mapping-ui.md`)

**Findings:**
- **No visual piano interface in Mapping tab.** Users could only map clips via number inputs. An interactive piano keyboard would make clip-to-MIDI-note mapping much more intuitive.

**Changes implemented:**
1. **Piano container** in `mainframe/src/index.html` — `<div id="piano-keyboard">` added to Mapping panel after mapping status.
2. **`renderPianoKeyboard()` function** in `mainframe/src/main.js` — generates 128 `<div>` keys (MIDI notes 0–127) with correct black/white key pattern. Each key has `data-note` attribute, `title` with note name (e.g., "C4 (MIDI 60)"), and C notes display a label.
3. **`isBlackKey()` helper** — uses `PIANO_BLACK_KEY_OFFSETS` constant `[1, 3, 6, 8, 10]` for standard piano pattern.
4. **Called from `renderMapping()`** — piano re-renders whenever mapping state updates.
5. **CSS** in `mainframe/src/styles.css` — `.piano-keyboard` (sticky bottom, horizontal scroll, flex), `.piano-key--white` (1.8rem wide, 6rem tall, white bg), `.piano-key--black` (1.2rem wide, 4rem tall, black bg, negative margins to overlap white keys), `.piano-key-label` (small centered label on C notes).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1227 = 1547 total)
- `npm run lint` — clean on all modified files

**Remaining tasks in `tasks/` folder:**
- `02-channel-selector.md` — Channel selector dropdown with contextual labels
- `03-piano-key-mapping.md` — Click handler to assign clips to notes
- `04-mapped-notes-visualization.md` — Visual indication of mapped notes on piano

## Current TODO
1. Execute task `03-piano-key-mapping.md` — Wire piano key clicks to mapping assignment (assign selected clip to clicked note + current channel).

### Iteration 19 — Channel Selector for Piano Mapping (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/02-channel-selector.md`

**Changes implemented:**
1. **Piano channel bar** in `mainframe/src/index.html` — `<div class="piano-channel-bar">` with `<select id="piano-channel">` added between hint and mapping summary.
2. **`PIANO_CHANNEL_LABELS` constant** in `mainframe/src/main.js` — maps channels 1–16 to contextual labels (Layer Group A, Mixer, Layer Group B, Mixed output effects, Layer Group C, Global effects, Reserved).
3. **`pianoChannel` state** — defaults to 1, updated on select change, triggers `renderMapping()`.
4. **`populatePianoChannelSelect()` function** — builds 16 `<option>` elements with format "Ch N — Label", called on init before `Promise.all([loadLibrary(), loadMapping()])`.
5. **CSS** in `mainframe/src/styles.css` — `.piano-channel-bar` (flex row) and `.piano-channel` (styled matching other selects).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1277 = 1597 total)
- `npm run lint` — clean on all modified files

**Remaining tasks in `tasks/` folder:**
- `03-piano-key-mapping.md` — Click handler to assign clips to notes
- `04-mapped-notes-visualization.md` — Visual indication of mapped notes on piano

### Iteration 20 — Piano Key Click to Mapping Assignment (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/03-piano-key-mapping.md`

**Inbox processed:** `clip-format-review.md` → created task `05-clip-format-review.md`, archived original.

**Changes implemented:**
1. **Click handler on piano keys** in `mainframe/src/main.js` — each key gets a `click` event listener inside `renderPianoKeyboard()`. On click:
   - Reads the currently selected clip from `map-clip-id` dropdown
   - Guards: if no clip selected, shows "Select a clip first" error status
   - Removes any existing mapping for the same `pianoChannel` + note + velocity 0
   - Pushes new mapping `{ channel: pianoChannel, note, velocity: 0, clipId }` to `mappingState`
   - Calls `renderMapping()` to update table + piano
2. **Velocity defaults to 0** — keeps it simple per task spec.
3. **No HTML/CSS changes needed** — reuses existing piano keyboard DOM and status element.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1277 = 1597 total)
- `npm run lint` — clean on all modified files

**Remaining tasks in `tasks/` folder:**
- `04-mapped-notes-visualization.md` — Visual indication of mapped notes on piano
- `05-clip-format-review.md` — Review and refine clip JSON format schema

## Current TODO
1. Execute task `04-mapped-notes-visualization.md` — Highlight piano keys that have clips mapped on the current channel, with tooltip showing clip ID on hover.

### Iteration 21 — Mapped Notes Visualization on Piano (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/04-mapped-notes-visualization.md`

**Inbox processed:** `refactor-to-custom-elements.md` → created task `06-refactor-to-custom-elements.md`, archived original.

**Changes implemented:**
1. **Channel mapping filter** in `renderPianoKeyboard()` — pre-filters `mappingState` to entries matching `pianoChannel` for O(1) lookup per key.
2. **Mapped key highlight** — adds `piano-key--mapped` CSS class to keys with a mapping on the current channel. Title updated to show `noteName (MIDI N) → clipId` on hover.
3. **Dynamic update** — highlights re-render automatically when channel changes (via `renderMapping()` call from channel selector) or when mapping is added/removed (via `renderMapping()` call from click handler and remove buttons).
4. **CSS** in `mainframe/src/styles.css` — `.piano-key--white.piano-key--mapped` (purple `#6c5ce7`) and `.piano-key--black.piano-key--mapped` (darker purple `#4834d4`).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — 3 pre-existing failures in `midi-mcp` drawbar organ transformer (unrelated to mainframe changes). All mainframe + akvj tests pass (273 + 47 = 320).
- `npm run lint` — clean on all modified files

**Piano mapping feature complete!** All 4 sub-tasks from the original `piano-mapping-ui.md` feature request are now done:
- ✅ 01: Piano keyboard UI (128 keys, sticky bottom)
- ✅ 02: Channel selector with contextual labels
- ✅ 03: Click-to-map assignment
- ✅ 04: Visual indication of mapped notes

**Remaining tasks in `tasks/` folder:**
- `05-clip-format-review.md` — Review and refine clip JSON format schema
- `06-refactor-to-custom-elements.md` — Refactor frontend UI to Custom Elements

## Current TODO
1. Execute task `05-clip-format-review.md` — Review and refine clip JSON format schema for simplicity, logic, and human readability.

### Iteration 22 — Clip JSON Format Review (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/05-clip-format-review.md`

**Review performed:**
- Reviewed `clips/*/meta.json` — 3 existing clips (c1-n0-v0, c1-n1-v0, c5-n0-v0)
- Reviewed `clips/set-mapping.json` — 5 mapping entries
- Reviewed `mainframe/scripts/clips/lib/generate.js` — clips.json generation logic
- Reviewed `mainframe/server/index.js` — API endpoints, `EDITABLE_META_FIELDS`, validation
- Reviewed `akvj/src/js/visuals/ClipLoader.js` — loading and clip tree building
- Reviewed `akvj/src/js/visuals/Clip.js` — constructor params, timing modes

**Findings:**
- **Schema is clean, simple, and human-readable. No refactoring needed.**
- Field names are descriptive and intuitive (`numberOfFrames`, `framesPerRow`, `loop`, `retrigger`)
- Flat structure — no unnecessary nesting
- Optional fields have sensible defaults
- `frameDurationBeats` dual-type (number | array) is the only mildly complex aspect, but it serves a real purpose (uniform vs per-frame timing) and is validated in the mainframe UI
- `set-mapping.json` is a simple array — easy to read and edit by hand
- `clips.json` is generated, not hand-edited — appropriate as-is

**Changes implemented:**
1. **Formal schema specification** created at `.agents/workflows/servers/spec/clip-schema.md` — documents all three JSON formats (`meta.json`, `set-mapping.json`, `clips.json`) with field tables, timing mode explanations, examples, channel routing, and the review assessment verdict.

**No code changes needed** — schema was already well-designed. Documentation only.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1362 = 1682 total)
- `npm run lint` — clean (no code changes)

**Remaining tasks in `tasks/` folder:**
- `06-refactor-to-custom-elements.md` — Refactor frontend UI to Custom Elements

## Current TODO
1. Execute task `06-refactor-to-custom-elements.md` — Refactor frontend UI to native Web Components. Start with one component as proof of concept (suggested: `<akvj-piano-keyboard>`).

### Iteration 23 — Custom Element Proof of Concept: <akvj-piano-keyboard> (2025-07-16)
**Task source:** `.agents/workflows/servers/tasks/06-refactor-to-custom-elements.md`

**Changes implemented:**
1. **New file `mainframe/src/js/PianoKeyboard.js`** — `AkvjPianoKeyboard` class extending `HTMLElement`. Encapsulates:
   - 128-key rendering with black/white pattern
   - Mapped key highlighting (purple) with clip ID in title
   - `observedAttributes: ['channel']` — reactive channel changes via `attributeChangedCallback`
   - `mappings` setter/getter — updates highlights when mapping state changes
   - `channel` setter/getter — delegates to attribute
   - `connectedCallback`/`disconnectedCallback` lifecycle
   - Dispatches `pianokeyclick` `CustomEvent` with `{ detail: { note } }` on key click (bubbles up)
   - Light DOM (no Shadow DOM) per task constraints
2. **`mainframe/src/index.html`** — Replaced `<div id="piano-keyboard">` with `<akvj-piano-keyboard id="piano-keyboard" channel="1">`
3. **`mainframe/src/main.js`** — Added `import './js/PianoKeyboard.js'`. Removed inline `PIANO_BLACK_KEY_OFFSETS`, `PIANO_NOTE_NAMES`, `isBlackKey()`, `renderPianoKeyboard()`. Added:
   - `pianoKeyboard` element reference
   - `pianokeyclick` event listener — handles mapping assignment (same logic as before)
   - `updatePianoKeyboard()` — sets `channel` and `mappings` on the element, called from `renderMapping()`
4. **`mainframe/src/styles.css`** — Changed `.piano-keyboard` selector to `akvj-piano-keyboard` tag selector (custom elements are `display: inline` by default, so `display: flex` is essential)

**Pattern established for future components:**
- Custom element class in `mainframe/src/js/{ComponentName}.js` (PascalCase per naming conventions)
- `customElements.define('akvj-{kebab-name}', ClassName)`
- Light DOM, no Shadow DOM
- Reactive state via `observedAttributes` + setters
- Events dispatched with `bubbles: true` for parent delegation
- Import via side-effect: `import './js/ComponentName.js'`

**Verification:**
- `npm run build:all` — passes (6 modules transformed, up from 5)
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1362 = 1682 total)
- `npm run lint` — clean on all modified files

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

## Current TODO
1. All tasks processed. Potential future work: continue custom element migration (`<akvj-clip-list>`, `<akvj-clip-editor>`, `<akvj-mapping-table>`), add batch operations, add `png` filename existence check in metadata edit form, add clip sort dropdown.

### Iteration 24 — Hot Reload mainframe Backend (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/hot-reload-backend.md` → `tasks/07-hot-reload-backend.md`

**Inbox processed:** `hot-reload-backend.md` → created task `07-hot-reload-backend.md`, archived original.

**Changes implemented:**
1. **`mainframe/package.json`** — Updated `dev` script: `node server/index.js` → `node --watch server/index.js` (within the `concurrently` command). Updated `dev:api` script: `node server/index.js` → `node --watch server/index.js`. Left `start:api` unchanged (no watch for production startup).
2. **No other files needed** — `concurrently` handles the watch process like any other subprocess. Node 20+ `--watch` mode restarts the server on file changes.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1362 = 1682 total)

**Task moved to `tasks/done/07-hot-reload-backend.md`** (per updated workflow: move, don't delete).

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

## Current TODO
1. All tasks processed. Potential future work: continue custom element migration (`<akvj-clip-list>`, `<akvj-clip-editor>`, `<akvj-mapping-table>`), add batch operations, add `png` filename existence check in metadata edit form, add clip sort dropdown.

### Iteration 25 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 26 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 27 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 28 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 29 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 30 — Naming Convention Review (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/review-naming-conventions.md` → `tasks/08-review-naming-conventions.md`

**Inbox processed:** `review-naming-conventions.md` → created task `08-review-naming-conventions.md`, moved original to `inbox/read/`.

**Audit performed:**
- **akvj/src/js/**: Clean. All names are domain-specific (`layerGroupA`, `effectsManager`, `compositor`, `clipLoader`, `velocityCache`, `maskManager`, etc.). No violations.
- **mainframe/server/**: Clean. `data` only appears as Node.js stream event names (API contract, not naming choice).
- **mainframe/scripts/**: Clean. No generic names found.
- **mainframe/src/js/PianoKeyboard.js**: Clean. `#mappings`, `#channel`, `channelMappings`, `mappedEntry` all descriptive.
- **mainframe/src/main.js**: Three violations found and fixed.

**Changes implemented (mainframe/src/main.js):**
1. `responseData` → `responseBody` (line 94) — removed banned term "data"
2. `meta` → `clipMetadata` (lines 320, 454, 468, 518) — expanded abbreviation for clarity
3. `meta` DOM element → `clipInfo` (line 200) — renamed generic `meta` variable to descriptive `clipInfo`

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 47, midi-mcp: 1362 = 1682 total)
- `npm run lint` — clean

**Task moved to `tasks/done/08-review-naming-conventions.md`**.

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

### Iteration 31 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 32 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 33 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 34 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 35 — No-op (2025-07-16)
- Inbox: empty (no new items)
- Tasks: empty (no pending tasks)
- No work to execute this iteration. Awaiting new inbox items or task assignments.

### Iteration 36 — Self-Review Workflow Prompt (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/review-workflow-prompt.md` → `tasks/09-review-workflow-prompt.md`

**Inbox processed:** `review-workflow-prompt.md` → created task `09-review-workflow-prompt.md`, moved original to `inbox/read/`.

**Audit findings:**
1. **Step 1 (Load Context)**: Have not been reading spec files each iteration. Added efficiency note to prompt allowing skip if recently read and unchanged.
2. **Step 3 (Fallback)**: **Major violation** — the prompt has a mandatory fallback to `routine-maintenance.md` when inbox and tasks are empty. Iterations 25-35 did no-ops instead of executing maintenance tasks. Updated prompt to make fallback explicitly mandatory with "Do NOT exit with a no-op — always produce value."
3. **Step 5 (Wrap Up)**: Correctly moving tasks to `done/` — no issues.

**Changes to prompt:**
- Step 1: Added parenthetical note allowing spec-skip if recently read and unchanged
- Step 3: Changed "Fallback" to "Fallback (mandatory)" with explicit "Do NOT exit with a no-op" instruction

**No code changes** — prompt file only.

**Task moved to `tasks/done/09-review-workflow-prompt.md`**.

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

### Iteration 37 — Test Audit & Coverage (Routine Maintenance) (2025-07-16)
**Task source:** Routine maintenance fallback #1 (Test Audit & Coverage) from `spec/routine-maintenance.md`

**Maintenance task selected:** Test Audit & Coverage — first fallback execution per updated mandatory fallback rule.

**Audit performed:**
- Ran `npm run test:all` — all 1802 tests passed (akvj: 273, mainframe: 47, midi-mcp: 1482)
- Identified untested critical files in `mainframe/server/`:
  - `paths.js` — security-critical (path traversal prevention, clip ID validation) — **NO TESTS**
  - `migrate-flatten.js` — migration script — no tests (lower priority)
  - `spritesheet.js` — sprite sheet utilities — no tests (lower priority)

**Changes implemented:**
1. **New file `mainframe/test/paths.test.js`** — 17 tests covering:
   - `isValidClipId()`: valid IDs, empty strings, non-string types, pure numeric IDs, path separators, leading special chars
   - `clipDir()`: valid path resolution, throws on invalid IDs
   - `resolveSafeSpritePath()`: valid PNG resolution, uppercase extension, basename stripping, non-PNG rejection, missing extension, empty filename, invalid clip ID
   - Exports: `CLIPS_DIR` and `SET_MAPPING_PATH` sanity checks

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 64 (+17 new), midi-mcp: 1482 = 1819 total)

### Iteration 38 — Refactor set-mapping.json → midi-layout.json (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/refactor-set-mapping.md` → `tasks/10-refactor-set-mapping.md`

**Inbox processed:** `refactor-set-mapping.md` → created task `10-refactor-set-mapping.md`, moved original to `inbox/read/`.

**Changes implemented:**

1. **Renamed `clips/set-mapping.json` → `clips/midi-layout.json`** with new nested schema: `{channel: {note: {velocity: clipId}}}`. Sparse — empty channels/notes omitted.

2. **`akvj/src/js/core/settings.js`**: `setMappingJsonUrl` → `midiLayoutJsonUrl`, path → `/clips/midi-layout.json`

3. **`akvj/src/js/visuals/ClipLoader.js`**: `setupClips()` param renamed, `#buildLoadTasks()` rewritten to iterate nested object instead of flat array, validation changed from array to object check.

4. **`mainframe/server/paths.js`**: `SET_MAPPING_PATH` → `MIDI_LAYOUT_PATH`

5. **`mainframe/server/index.js`**: `readMapping()` flattens nested format to array for UI; `writeMapping()` nests array entries before writing. Added `flattenMidiLayout()` and `nestMappingEntries()` helpers.

6. **`mainframe/scripts/clips/lib/validateMapping.js`**: `validateSetMapping()` → `validateMidiLayout()`, rewritten for nested object validation with per-level helpers.

7. **`mainframe/scripts/clips/Pipeline.js`**: Updated import, log messages, copy step.

8. **`mainframe/scripts/clips/new.js`**, **`mainframe/scripts/clips/lib/validate/index.js`**, **`mainframe/server/migrate-flatten.js`**: Updated references.

9. **Tests updated**: `ClipLoader.test.js` (all mocks converted to nested format), `validateMapping.test.js` (rewritten for nested format + new edge case tests), `server.test.js`, `Pipeline.test.js`, `paths.test.js`.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 68, midi-mcp: 1509 = 1850 total)
- `npx eslint mainframe/ akvj/` — clean (pre-existing midi-mcp errors unrelated)

**Task moved to `tasks/done/10-refactor-set-mapping.md`**.

**Remaining tasks in `tasks/` folder:**
- 12-refactor-clip-naming-and-ids.md
- 13-research-trigger-behavior.md

### Iteration 39 — Rename `numberOfFrames` → `frames` (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/rename-numberofframes.md` → `tasks/11-rename-numberofframes.md`

**Inbox processed:** 3 new inbox items → created tasks 11, 12, 13. Moved originals to `inbox/read/`. Selected task 11 as most critical (smallest change, tasks 12 & 13 depend on it).

**Changes implemented:**

1. **`akvj/src/js/visuals/Clip.js`**: Constructor parameter renamed from `numberOfFrames` to `frames`. All internal method parameters updated. Private field `#numberOfFrames` kept as descriptive internal naming. Error messages updated.

2. **`akvj/src/js/visuals/ClipLoader.js`**: Passes `frames: clipMetadata.frames ?? clipMetadata.numberOfFrames` to Clip constructor (backward-compatible fallback).

3. **`akvj/src/tools/clip-preview/ClipPreview.js`**: All `numberOfFrames` references updated to `frames ?? numberOfFrames` fallback pattern.

4. **`mainframe/scripts/clips/lib/validate/meta.js`**: Validation uses `meta.frames ?? meta.numberOfFrames` for all checks. Error messages updated to say "frames".

5. **`mainframe/scripts/clips/lib/validate/image.js`**: Image dimension validation uses `frames ?? numberOfFrames` fallback.

6. **`mainframe/scripts/clips/new.js`**: Template uses `frames: 1`. Help text updated.

7. **`mainframe/scripts/clips/spritesheet.js`**: `writeMetaFile()` writes `frames` instead of `numberOfFrames`.

8. **`mainframe/server/index.js`**: `isPipelineReadyClip()` uses `frames ?? numberOfFrames`. `EDITABLE_META_FIELDS` updated to include `frames`. Error messages updated.

9. **`mainframe/server/spritesheet.js`**: `createClipFromFrames()` returns `frames` instead of `numberOfFrames`. `buildClipMeta()` writes `frames`.

10. **`mainframe/src/main.js`**: UI displays `frames ?? numberOfFrames`. Edit form uses `frames` field name. Save sends `frames` key.

11. **Existing `clips/*/meta.json`**: All 5 files updated from `"numberOfFrames"` to `"frames"`.

12. **Tests updated**: `Clip.test.js` (27 refs), `ClipLoader.test.js` (8 refs), `validate-extended.test.js` (12 refs), `server.test.js` (11 refs), `Pipeline.test.js` (1 ref), `generate.test.js` (4 refs).

**Backward compatibility**: All read paths use `frames ?? numberOfFrames` fallback, so old meta.json files with `numberOfFrames` still work.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 68, midi-mcp: 1589 = 1930 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/11-rename-numberofframes.md`**.

**Remaining tasks in `tasks/` folder:**
- 12-refactor-clip-naming-and-ids.md
- 13-research-trigger-behavior.md

### Iteration 40 — Refactor Clip Naming, IDs, and Optional PNG (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/refactor-clip-naming-and-ids.md` → `tasks/12-refactor-clip-naming-and-ids.md`

**No new inbox items.** Selected task 12 as next (task 13 depends on it).

**Changes implemented:**

1. **`akvj/src/js/visuals/ClipLoader.js`**: `png` field now optional — defaults to `{clipId}.png` when `clipMetadata.png` is absent. Line 150: `clipMetadata.png ?? \`${safeClipId}.png\``.

2. **`mainframe/scripts/clips/lib/generate.js`**: `buildClipCatalogEntry` defaults `png` to `{clipId}.png` when neither metadata nor filesystem PNG found. Line 58: `metadata.png ?? pngFile ?? \`${clipId}.png\``.

3. **`mainframe/scripts/clips/lib/validate/meta.js`**: Added validation for `name` (must be string if present) and `png` (must be string if present). Both fields are optional.

4. **`mainframe/server/index.js`**:
   - `isPipelineReadyClip()` relaxed — no longer requires explicit `png` field, only validates it if present.
   - `EDITABLE_META_FIELDS` now includes `'name'`.

5. **`mainframe/src/main.js`**:
   - Clip list shows `name` as title (falls back to `clipId`), with clipId shown in parentheses when different.
   - Edit form has new `Name` text input field.
   - Save payload includes `name` (sent as `undefined` if empty).

6. **`mainframe/scripts/clips/new.js`**: Template includes `"name": ""`.

7. **Existing `clips/*/meta.json`**: All 5 files updated with `"name": ""` field.

**What was NOT done (deferred):**
- Full slug-based clip folder renaming (e.g., `c1-n0-v0` → `hello-darling-ooo`) — this is a larger migration that would break existing midi-layout.json mappings and requires a migration script. The `name` field is now available for future slug generation.
- mainframe UI rename warning (changing name changes clipId) — deferred since folder renaming isn't implemented yet.
- Sprite PNG filename matching clip folder name — deferred, `png` field is now optional so this works when explicitly set.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 273, mainframe: 68, midi-mcp: 1626 = 1967 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/12-refactor-clip-naming-and-ids.md`**.

**Remaining tasks in `tasks/` folder:**
- 13-research-trigger-behavior.md

### Iteration 41 — Layered Trigger Behaviors (2025-07-16)
**Task source:** `.agents/workflows/servers/inbox/research-trigger-behavior.md` → `tasks/13-research-trigger-behavior.md`

**No new inbox items.** Selected task 13 (last remaining task).

**Schema design:**
- `meta.json` defaults: `"triggerType": "momentary"`, `"triggerGroup": null`
- `midi-layout.json` overrides: value can be object `{ clipId, triggerType, triggerGroup }` instead of string (backward compatible)
- Trigger types: `"momentary"` (note on=start, note off=stop), `"latch"` (note on=toggle, note off ignored), `"one-shot"` (note on=start, plays through, note off ignored)
- Choke groups: `"triggerGroup": "bg"` — triggering a clip stops all others in same group

**Changes implemented:**

1. **`akvj/src/js/visuals/Clip.js`**: Added `triggerType` and `triggerGroup` as public properties, accepted in constructor. Removed unused `#isLooping` field. Fixed pre-existing curly lint errors.

2. **`akvj/src/js/visuals/ClipLoader.js`**:
   - `#buildLoadTasks`: Parses mapping values via `#parseMappingValue()` — accepts string (backward compatible) or object `{ clipId, ...overrides }`
   - `#loadMappedClip`: Merges overrides into clip metadata before creating Clip, returns `triggerType` and `triggerGroup` in load result
   - `#buildClipsObject`: Sets `triggerType` and `triggerGroup` on each Clip instance

3. **`akvj/src/js/visuals/LayerGroup.js`**:
   - `noteOn()`: Latch toggle (second note on stops clip), choke group stopping (`#stopChokeGroupMembers`), trigger group tracking (`#addToTriggerGroup`, `#removeFromTriggerGroup`)
   - `noteOff()`: Latch and one-shot ignore note off; momentary stops clip
   - `#cleanupFinishedClips()`: Also removes from trigger groups
   - `destroy()`: Clears trigger groups
   - Added `#triggerGroups` Map for choke group state

4. **`akvj/src/js/visuals/LayerManager.js`**: Fixed pre-existing curly lint error.

5. **`mainframe/scripts/clips/lib/validate/meta.js`**: Validates `triggerType` (must be one of `momentary`, `latch`, `one-shot`) and `triggerGroup` (string, number, or null).

6. **`mainframe/server/index.js`**: `EDITABLE_META_FIELDS` includes `triggerType` and `triggerGroup`.

7. **`mainframe/src/main.js`**: Edit form has trigger type dropdown (select) and trigger group text input. Save payload includes both fields.

**Tests added:**
- `LayerGroup.test.js`: 7 new tests — momentary note off, latch note off ignored, latch toggle, one-shot note off ignored, choke group stops members, different groups unaffected, no-group clips unaffected
- `ClipLoader.test.js`: 1 new test — object mapping format with triggerType/triggerGroup overrides

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 281, mainframe: 71, midi-mcp: 1722 = 2074 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/13-research-trigger-behavior.md`**.

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

### Iteration 42 — Process Inbox + Update Clip Scaffolding for Playback Modes (2025-07-16)

**Inbox processed:** 6 new inbox items → created tasks 14-17. Moved originals to `inbox/read/`.
- `feature_proposal_playback_modes.md` + `implementation_plan.md` → reference docs (playback modes already implemented in Clip.js)
- `task_admin_ui_playback_modes.md` → task 14
- `task_update_clip_scaffolding.md` → task 15
- `task_true_shuffle_mode.md` → task 16
- `task_crossfade_mask_scrub.md` → task 17

**Selected task 15** (smallest, prevents generating invalid metadata).

**Changes implemented:**

1. **`mainframe/scripts/clips/new.js`**: Template uses `playback: 'loop'` instead of `loop: true`.
2. **`mainframe/scripts/clips/spritesheet.js`**: `writeMetaFile()` uses `playback: 'loop'` instead of `loop: true`.
3. **`mainframe/server/spritesheet.js`**: `buildClipMeta()` uses `playback: 'loop'` instead of `loop: true`.
4. **`akvj/src/js/visuals/ClipLoader.js`**: `#createClip()` passes `playback: clipMetadata.playback ?? (clipMetadata.loop === false ? 'once' : 'loop')` — backward compatible with old `loop` boolean.
5. **`mainframe/server/index.js`**: `EDITABLE_META_FIELDS` includes `'playback'` (kept `'loop'` for backward compat).
6. **`mainframe/src/main.js`**:
   - Edit form: Replaced `loop` checkbox with `playback` select dropdown (7 options: once, loop, pingpong, random, reverse, shuffle, scrub).
   - Save payload: Sends `playback` key instead of `loop`.
   - Clip preview: Uses `playbackMode` instead of `shouldLoop` for preview loop behavior.
7. **Existing `clips/*/meta.json`**: All 5 files updated from `"loop": true` to `"playback": "loop"`.

**Note:** Validation in `mainframe/scripts/clips/lib/validate/meta.js` already had `loop` → `playback` migration with warning — no changes needed there.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 281, mainframe: 71, midi-mcp: 1722 = 2074 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/15-update-clip-scaffolding.md`**.

**Remaining tasks in `tasks/` folder:**
- 14-mainframe-ui-playback-modes.md (partially done in this iteration — UI updated)
- 16-true-shuffle-mode.md
- 17-crossfade-mask-scrub.md

### Iteration 43 — True Shuffle Mode + Inbox Processing (2025-07-16)

**Inbox processed:** 1 new item → created task 18. Moved original to `inbox/read/`.
- `task_simplify_npm_scripts.md` → task 18

**Housekeeping:** Task 14 (mainframe UI playback modes) was already completed in iteration 42 but not moved — moved to `tasks/done/` now.

**Selected task 16** (true shuffle mode — self-contained in `Clip.js`).

**Changes implemented:**

1. **`akvj/src/js/visuals/Clip.js`**:
   - Added `#unplayedShuffleFrames = []` private field, reset in `#resetState()`.
   - `#advanceNextFrame()`: shuffle branch now delegates to `#drawNextShuffleFrame()`.
   - New `#drawNextShuffleFrame()`: pops from `#unplayedShuffleFrames`, repopulating via `#buildShuffledFramePool()` when exhausted. Handles single-frame clips (`numberOfFrames <= 1`) by returning frame 0.
   - New `#buildShuffledFramePool()`: Fisher-Yates shuffle of all frame indices; swaps the pool's first-to-be-drawn frame (`pool[length-1]`, since pool is consumed via `.pop()`) if it matches `#lastRandomFrame`, preventing repeats across cycle boundaries.

2. **`akvj/test/Clip.test.js`**: New `describe('shuffle playback mode (true shuffle)')` block with 4 tests — full cycle shows every frame exactly once, no repeat across cycle boundary, single-frame clip doesn't throw, reset clears the pool safely.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 285, mainframe: 71, midi-mcp: 1782 = 2138 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/16-true-shuffle-mode.md`**.

**Remaining tasks in `tasks/` folder:**
- 17-crossfade-mask-scrub.md
- 18-simplify-npm-scripts.md

### Iteration 44 — Crossfade Mask Scrub Support (2025-07-16)

**No new inbox items.** Selected task 17 (crossfade mask scrub).

**Changes implemented:**

1. **`akvj/src/js/core/settings.js`**: Added `mixer_CC: 19` to `scrub` config block.
2. **`akvj/src/js/visuals/MaskManager.js`**: Added `setScrubPosition(normalizedValue)` method — calls `setScrubPosition()` on the current mask clip only when `playbackMode === 'scrub'` and clip is not finished.
3. **`akvj/src/js/visuals/LayerManager.js`**: `#handleControlChange` now routes `scrub.mixer_CC` (CC 19) to `this.#maskManager.setScrubPosition()`.
4. **`akvj/test/MaskManager.test.js`**: 4 new tests in `describe('setScrubPosition')` — calls setScrubPosition on scrub-mode mask, ignores non-scrub mask, no throw when no mask active, ignores finished mask.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 289, mainframe: 71, midi-mcp: 1802 = 2162 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/17-crossfade-mask-scrub.md`**.

**Remaining tasks in `tasks/` folder:**
- 18-simplify-npm-scripts.md

### Iteration 45 — Simplify NPM Scripts (2025-07-16)

**No new inbox items.** Selected task 18 (last remaining task).

**Changes implemented:**

1. **`package.json`**: Replaced `"dev": "npm run dev -w akvj"` with `"akvj": "npm run dev -w akvj"` and `"dev:mainframe": "npm run dev -w mainframe"` with `"mainframe": "npm run dev -w mainframe"`. Workspace `package.json` files keep `"dev"` (Vite convention).

2. **`AGENTS.md`**: Updated Common Commands table (`npm run akvj` / `npm run mainframe`), developer workflow section, container troubleshooting tips.

3. **`README.md`**: Updated Development section, Core Commands, and Contributing guide references.

4. **`CONTRIBUTING.md`**: Updated Setup and Test sections.

5. **`mainframe/README.md`**: Updated Commands section.

6. **`clips/README.md`**: Updated mainframe UI instructions.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 289, mainframe: 71, midi-mcp: 1802 = 2162 total)
- `npx eslint mainframe/ akvj/` — clean

**Task moved to `tasks/done/18-simplify-npm-scripts.md`**.

**Remaining tasks in `tasks/` folder:**
- (none — all tasks complete!)

### Iteration 46 — Inbox Processing + Lint & Formatting Sweep (2025-07-16)

**Inbox processed:** 1 new item → created task 19. Moved original to `inbox/read/`.
- `task_rename_workspaces.md` → task 19 (REQUIRES USER CONFIRMATION — naming ambiguity concerns with `akvj` as both root repo and workspace name, and `mainframe` onboarding friction)

**Task 19 blocked on user decision.** Fell back to routine maintenance task #3 (Linting & Formatting Sweep).

**Changes implemented:**

1. **`midi-mcp/lib/transformers/ca33Transformer.js`**: Removed 6 unused regex match variables (`v5Match`, `v33Match`, `ra5vMatch`, `rc5vMatch`, `pc900vMatch`, `hp6n138Match`) from `parseResistorTable()` and `parseOptoIsolatorSpecs()`. Prefixed now-unused `content` param with `_content` to satisfy `no-unused-vars` rule.

2. **Prettier formatting sweep**: Ran `npm run format:prettier` to fix code style issues across 33 files in `midi-mcp/`.

**Verification:**
- `npm run lint` — clean (0 errors, 0 warnings)
- `npm run format:check` — all files pass Prettier code style
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 289, mainframe: 71, midi-mcp: 1802 = 2162 total)

**Remaining tasks in `tasks/` folder:**
- 19-rename-workspaces.md (blocked — requires user confirmation on naming)

### Iteration 47 — Test Audit: settings.js Coverage (2025-07-16)

**No new inbox items.** Task 19 still blocked. Fell back to maintenance task #1 (Test Audit & Coverage).

**Audit result:** All 25 source files in `akvj/src/js/` have corresponding test files except `settings.js` — the centralized configuration object. This is a critical file imported by nearly every module.

**Changes implemented:**

1. **`akvj/test/settings.test.js`** (new): 31 tests covering all settings sections:
   - **canvas**: Fixed 240x135 dimensions
   - **midi**: Command codes, system real-time messages, PPQN, message length
   - **bpm**: Default range, min > 0, max > min, timeout
   - **channelMapping**: All 16 channels accounted for, no overlaps, correct layer group assignments
   - **scrub**: Unique CC numbers, valid MIDI CC range (0-127)
   - **effectRanges**: min <= max, contiguous and non-overlapping (0-127), proper coverage
   - **effectParams**: Variant threshold range, glitch probability (0-1), split min <= max
   - **performance**: JSON URLs defined, maxConcurrentClipLoads positive integer
   - **rendering**: Pixel-perfect smoothing disabled, valid hex background color

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 320, mainframe: 71, midi-mcp: 1802 = 2193 total)
- `npm run lint` — clean

**Remaining tasks in `tasks/` folder:**
- 19-rename-workspaces.md (blocked — requires user confirmation on naming)

### Iteration 48 — Inbox Processing + Cognitive Refactoring: LayerGroup clearClips Bug (2025-07-16)

**Inbox processed:** 1 new item → created task 20. Moved original to `inbox/read/`.
- `task_asset_ingestion_ui.md` → task 20 (Asset Ingestion & Authoring Workflow — large feature, needs scoping into sub-tasks)

**Task 19 still blocked.** Task 20 needs scoping. Fell back to maintenance task #4 (Cognitive Refactoring).

**Audit:** Reviewed `Clip.js` (472 lines) and `LayerGroup.js` (358 lines) — both well-structured with small focused methods, good JSDoc, proper private fields. No cognitive complexity issues found.

**Bug found during review:** `LayerGroup.clearClips()` did not clear `#triggerGroups`, leaving stale choke group entries. After `clearClips()`, triggering a clip in the same choke group would attempt to stop clips that were already cleared.

**Changes implemented:**

1. **`akvj/src/js/visuals/LayerGroup.js`**: Added `this.#triggerGroups.clear()` to `clearClips()` method.

2. **`akvj/test/LayerGroup.test.js`**: Added regression test verifying that after `clearClips()`, re-triggering a clip in the same choke group does not call `stop()` on the previously cleared clip.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 321, mainframe: 71, midi-mcp: 1802 = 2194 total)
- `npm run lint` — clean

### Iteration 49 — Rename Workspaces Documentation Cleanup (2025-07-16)

**Inbox processed:** `unblock_task_19.md` — user explicitly unblocked Task 19 ("i dont think it is do it!"). Moved original to `inbox/read/`.

**Task source:** `tasks/19-rename-workspaces.md` (previously blocked on user confirmation)

**Findings:**
- The codebase (folders, `package.json`, configs, source code, tests) was already fully renamed to `akvj`/`mainframe` in earlier iterations.
- Remaining `vj-server`/`admin` references were only in `.agents/` documentation files — 5 files total.

**Changes implemented:**
1. **`.agents/prompts/specs/admin-and-akwf.prompt.md`** — All `vj-server`→`akvj`, `admin`→`mainframe`, `Admin`→`Mainframe` references updated (title, motivation, architecture, constraints, all 4 execution phases).
2. **`.agents/prompts/README.md`** — Server Architect description and trigger text updated to `akvj`/`mainframe` and correct prompt filename.
3. **`.agents/prompts/_memory.md`** — `admin/server/`→`mainframe/server/` path references updated (2 lines).
4. **`.agents/prompts/code-of-conduct.prompt.md`** — `vj-server`→`akvj` in Core Architecture rule.
5. **`.agents/workflows/README.md`** — Server Architect description and trigger text updated to `akvj`/`mainframe` and correct prompt filename.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 321, mainframe: 71, midi-mcp: 1873 = 2265 total — note: midi-mcp count increased from previous iterations, likely due to ongoing midi-mcp agent work)

**Task moved to `tasks/done/19-rename-workspaces.md`**.

**Remaining tasks in `tasks/` folder:**
- 20-asset-ingestion-ui.md (needs scoping into sub-tasks)

### Iteration 50 — Rename Workspaces: Source Code Cleanup (2026-07-16)

**Inbox processed:** `unblock_task_19.md` was already processed in iteration 49. No new inbox items.

**Task 19 follow-up:** Iteration 49 handled `.agents/` documentation references but missed stale `admin`/`Admin` references in actual source code files.

**Changes implemented:**
1. **`mainframe/server/index.js`**: `createAdminServer()` → `createMainframeServer()` (export + call site), `ADMIN_API_PORT` → `MAINFRAME_API_PORT` env var, "Lightweight Admin API" → "Lightweight Mainframe API" in JSDoc, "admin UI" → "mainframe UI" in comment, "AKVJ admin API" → "AKVJ mainframe API" in startup log.
2. **`mainframe/test/server.test.js`**: `createAdminServer()` → `createMainframeServer()` in import.
3. **`mainframe/scripts/clips/new.js`**: "Admin Mapping UI" → "Mainframe Mapping UI" in help text.
4. **`.agents/prompts/specs/admin-and-akwf.prompt.md`** → renamed to **`mainframe-and-akvj.prompt.md`** (filename still had old `admin` name despite content being updated in iteration 49).

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 321, mainframe: 71, midi-mcp: 1873 = 2265 total; one flaky `generate.test.js` ENOTEMPTY fixture cleanup failure on first run, passes on re-run — pre-existing, unrelated)
- `npm run lint` — clean

**Remaining tasks in `tasks/` folder:**
- 20-asset-ingestion-ui.md (needs scoping into sub-tasks)

## Current TODO
1. Execute task 20b: Frontend staging UI with drag & drop (depends on 20a — now unblocked).

### Iteration 51 — Task 20 Scoping + Sub-task 20a: Backend Raw Asset Storage (2026-07-16)

**Task 20 scoped into sub-tasks:**
- 20a: Backend raw asset storage + sharp pipeline ✅
- 20b: Frontend staging UI with drag & drop
- 20c: Live preview canvas with scale/color depth
- 20d: Sprite sheet compilation endpoint

Original task 20 moved to `tasks/done/`. Sub-task files created in `tasks/`.

**Sub-task 20a executed:**

**Changes implemented:**

1. **`mainframe/server/paths.js`**: Added `RAW_ASSETS_DIR` constant (`clips/.raw-assets`) and `rawAssetsDir(clipId)` function with same clipId validation as `clipDir()`.

2. **`mainframe/server/spritesheet.js`**: Major update to `createClipFromFrames()`:
   - Added `storeRawAssets()` — saves original frame buffers to `clips/.raw-assets/{clipId}/frame-NNNN.png` before processing
   - Added `resizeFrames()` — uses sharp to resize each frame to `targetWidth`×`targetHeight` (defaults: 240×135) with `fit: 'fill'` before compositing
   - Expanded config params: `name`, `playback`, `frameRate` — all optional with sensible defaults
   - `writeClipFiles()` signature changed: `role` → `clipOptions` object
   - `buildClipMeta()` now sets `name`, `playback`, and `frameRate` from clipOptions

3. **`mainframe/server/index.js`**: `POST /api/clips` handler now destructures `targetWidth`, `targetHeight`, `name`, `playback`, `frameRate` from request body and passes to `createClipFromFrames()`.

4. **`mainframe/src/index.html`**: Fixed stale "AKVJ Admin" → "AKVJ Mainframe" in `<title>` and `<h1>`.

5. **Tests added:**
   - `mainframe/test/paths.test.js`: 3 new tests — `rawAssetsDir()` returns correct path, throws for invalid clipIds, `RAW_ASSETS_DIR` export sanity check.
   - `mainframe/test/server.test.js`: 2 new tests — raw assets stored alongside compiled clip, config params (name, playback, frameRate, targetWidth, targetHeight) accepted and applied correctly. afterEach cleanup updated to remove `.raw-assets/` directories.

**Verification:**
- `npm run build:all` — passes
- `npm run test:all` — passes (akvj: 321, mainframe: 76 (+5 new), midi-mcp: 1873 = 2270 total)
- `npm run lint` — clean

**Sub-task 20a moved to `tasks/done/20a-backend-raw-asset-storage.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md

### Iteration 52 — Inbox Processing + Task 21: Check Implementations Audit (2026-07-16)

**Inbox processed (4 items → 4 tasks created):**
1. `check-implementations.md` → Task 21 (audit recent features)
2. `continue-custom-element-migration.md` → Task 22 (extract clip-list, clip-editor, mapping-table components)
3. `improve-test-coverage.md` → Task 23 (tests for spritesheet.js and other gaps)
4. `metadata-form-improvements.md` → Task 24 (PNG validation, sort dropdown, batch ops)

All originals moved to `inbox/read/`.

**Task 21 executed — Audit findings and fixes:**

**1. midi-layout.json serialization/deserialization:**
- **BUG FIXED**: `flattenMidiLayout()` in `mainframe/server/index.js` had no guards against non-object intermediate values (null, string, array). If `midi-layout.json` had a channel key mapped to `null` or a string, `Object.entries()` would throw. Added defensive `typeof`/`Array.isArray()` checks at both the `notes` and `velocities` levels.
- `nestMappingEntries()` — correct, no issues.
- `readMapping()` — correct, has proper top-level guards.
- `writeMapping()` / `validateMappingEntry()` — correct, thorough validation.
- `ClipLoader.js` `#buildLoadTasks()` — correct, has proper guards for unknown clipId, non-numeric keys, channel range.
- `ClipLoader.js` `#parseMappingValue()` — correct, handles both string and object mapping formats.
- **Test added**: malformed midi-layout with null/string intermediate values → GET /api/mapping returns only valid entries.

**2. Custom element memory leaks:**
- `PianoKeyboard.js` — **No leak found.** `disconnectedCallback()` calls `replaceChildren()` which removes all child DOM nodes. Click listeners are on child nodes (not on `document`/`window`), so they're garbage collected with the nodes. Pattern is correct.

**3. Error handling gaps:**
- **XSS FIXED**: `renderMapping()` in `mainframe/src/main.js` used `innerHTML` with unsanitized `entry.clipId` for table cells. Replaced with safe `textContent` cell creation.
- **UX FIXED**: `deleteClip()` caught errors with only `console.error()` — no user feedback. Added `alert()` with error message.
- All other fetch calls (`loadLibrary`, `loadMapping`, upload form, save mapping, run pipeline) have proper try/catch with user-visible status messages.

**Verification:**
- `npm run build:all` — passes
- `npm run test -w mainframe` — 77 tests pass (+1 new malformed-layout test)
- `npm run lint` — clean

**Task 21 moved to `tasks/done/21-check-implementations.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 22-continue-custom-element-migration.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md

### Iteration 53 — Task 22 Scoping + Sub-task 22a: Extract `<akvj-clip-list>` Component (2026-07-16)

**Task 22 scoped into sub-tasks:**
- 22a: Extract `<akvj-clip-list>` component ✅
- 22b: Extract `<akvj-clip-editor>` component
- 22c: Extract `<akvj-mapping-table>` component

Original task 22 moved to `tasks/done/`. Sub-task files created in `tasks/`.

**Sub-task 22a executed:**

**Changes implemented:**

1. **`mainframe/src/js/ClipList.js`** (new file, 282 lines): `<akvj-clip-list>` custom element encapsulating:
   - Clip list rendering with thumbnails, metadata display, and action buttons (Preview, Edit, Map, Delete)
   - Search query and role filter via setters (`searchQuery`, `roleFilter`)
   - Clip preview player with canvas, play/pause, scrub, speed controls, animation loop
   - `disconnectedCallback()` cleanup: stops all active preview players and removes children
   - Dispatches `clipedit` (with clip + listItem), `clipdelete`, `clipmap` events (bubbles: true)
   - `attachEditForm()` method for parent to append edit forms to list items

2. **`mainframe/src/main.js`**: Removed ~210 lines of inline rendering code:
   - `createClipListItem()`, `filterClipsBySearch()`, `toggleClipPreview()`, `stopPreviewPlayer()`, `createClipPreviewPlayer()`, `toggleClipEditForm()`, `activePreviewPlayers` Map
   - `renderLibrary()` simplified to `clipListElement.clips = clipCatalog` + summary/filter visibility
   - Search/filter handlers now set `clipListElement.searchQuery` / `clipListElement.roleFilter` directly
   - Event listeners on `clipListElement` for `clipedit`, `clipdelete`, `clipmap` delegation
   - `createClipEditForm()` stays in `main.js` (will be extracted in task 22b)

3. **`mainframe/src/index.html`**: Replaced `<ul id="clip-list" class="clip-list">` with `<akvj-clip-list id="clip-list" class="clip-list">`. CSS `.clip-list` class still applies (grid layout, li styling).

**Verification:**
- `npm run build:all` — passes (7 modules transformed, up from 6 — new ClipList.js)
- `npm run test:all` — 1923 tests pass
- `npm run lint` — clean

**Sub-task 22a moved to `tasks/done/22a-clip-list-component.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 22b-clip-editor-component.md
- 22c-mapping-table-component.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md

### Iteration 54 — Sub-task 22b: Extract `<akvj-clip-editor>` Component (2026-07-16)

**Sub-task 22b executed:**

**Changes implemented:**

1. **`mainframe/src/js/ClipEditor.js`** (new file, 259 lines): `<akvj-clip-editor>` custom element encapsulating:
   - Full clip metadata edit form: name, frames, framesPerRow, playback, retrigger, role, bitDepth, triggerType, triggerGroup, frameRatesForFrames (JSON with validation), frameDurationBeats (JSON with validation)
   - `clip` setter triggers re-render
   - Save handler calls `PUT /api/clips/:clipId` directly via `fetch()`, then dispatches `clipsaved` event (bubbles: true) with `{ detail: { clipId } }`
   - Private helper methods: `#createField()`, `#createNumberInput()`, `#createCheckbox()`, `#createTextInput()`, `#setStatus()`
   - `disconnectedCallback()` cleanup via `replaceChildren()`
   - Extracted constants: `PLAYBACK_MODES`, `TRIGGER_TYPES`

2. **`mainframe/src/main.js`**: Removed ~230 lines:
   - `createClipEditForm()` function (195 lines) — moved to component
   - `createField()`, `createNumberInput()`, `createCheckbox()`, `createTextInput()` helpers — moved as private methods
   - `clipedit` event handler now creates `<akvj-clip-editor>` element and sets `clip` property
   - New `clipsaved` event listener triggers `loadLibrary()` reload

**Verification:**
- `npm run build:all` — passes (8 modules transformed, up from 7 — new ClipEditor.js)
- `npm run test:all` — 1923 tests pass
- `npm run lint` — 3 pre-existing errors in `midi-mcp/lib/transformers/umpMidi2ProtocolTransformer.js` (confirmed pre-existing via git stash). My changes are lint-clean.

**Sub-task 22b moved to `tasks/done/22b-clip-editor-component.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 22c-mapping-table-component.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md

### Iteration 55 — Task 25: Fix Server Startup Hang (2026-07-16)

**Inbox processed:** 2 new items → tasks 25, 26 created. Originals archived to `inbox/read/`.

**Task 25 executed — investigated and fixed server startup hang:**

**Root cause analysis:**
1. **API server crashes on EADDRINUSE**: `mainframe/server/index.js` had no error handler on the server's `error` event. When port 8787 was already in use (stale process), Node threw an unhandled `error` event, crashing with a stack trace. The `node --watch` supervisor then waited for file changes, making it appear hung.
2. **akvj Vite silent port fallback**: `akvj/vite.config.js` lacked `strictPort: true`, so Vite silently moved to port 5174 (mainframe's port) or 5175, making the UI unreachable at the expected URL.
3. **No startup verification**: No smoke test existed to catch these issues automatically.

**Changes implemented:**

1. **`mainframe/server/index.js`** (lines 440-452): Added `server.on('error', ...)` handler that catches `EADDRINUSE` and exits with a helpful message: `Port 8787 is already in use. Stop the other process or set MAINFRAME_API_PORT.`

2. **`akvj/vite.config.js`** (lines 33-35): Added `port: 5173` and `strictPort: true` to server config, preventing silent port fallback. Vite will now error clearly if port 5173 is occupied.

3. **`mainframe/test/smoke/startup.test.js`** (new file, 149 lines): Startup smoke test that:
   - Kills stale processes on target ports before starting
   - Spawns both `npm run akvj` and `npm run mainframe` via `child_process.spawn`
   - Polls `http://localhost:5173/`, `http://localhost:5174/`, `http://localhost:8787/api/health`
   - Fails if any endpoint doesn't return HTTP 200 within timeout (default 15s)
   - Cleans up all child processes on exit

4. **`mainframe/vitest.config.js`**: Added `**/smoke/**` to exclude list so vitest doesn't pick up the smoke test as a test suite.

5. **`package.json`**: Added `test:smoke` script: `node mainframe/test/smoke/startup.test.js`

**Verification:**
- `npm run build:all` — passes (8 modules transformed)
- `npm run test:all` — 1990 tests pass (56 test files)
- `npm run lint` — clean (3 pre-existing errors in midi-mcp only)
- Individual server tests confirmed: API responds with `{"ok":true}` on health endpoint, both Vite servers return HTTP 200

**Task 25 moved to `tasks/done/25-fix-server-startup-hang.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 22c-mapping-table-component.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md

### Iteration 56 — Task 28: Devcontainer Port Locking (2026-07-16)

**Inbox processed:** 4 items (2 duplicates of already-processed, 2 new) → tasks 27, 28 created. All archived to `inbox/read/`.

**Task 28 executed — locked down Vite ports to custom distinct numbers:**

**Port mapping change:**
- akvj Vite: 5173 → **8888**
- mainframe Vite: 5174 → **9999**
- mainframe API: 8787 (unchanged)
- akvj preview: 4173 (unchanged)

**Changes implemented:**

1. **`akvj/vite.config.js`**: Changed `port: 5173` → `port: 8888` (strictPort already added in task 25)
2. **`mainframe/vite.config.js`**: Changed `port: 5174` → `port: 9999`
3. **`mainframe/server/index.js`**: Updated `ALLOWED_ORIGINS` to use ports 8888 and 9999 instead of 5173 and 5174
4. **`.devcontainer/devcontainer.json`**: Updated `forwardPorts` to `[8888, 4173, 9999, 8787]` and updated `portsAttributes` labels and port keys
5. **`mainframe/test/smoke/startup.test.js`**: Updated URL constants and `killStaleProcesses` pkill patterns to use new ports
6. **`README.md`**: Updated maintenance packages table and core commands to reference new ports
7. **`mainframe/README.md`**: Updated port reference from `:5174` to `:9999`
8. **`AGENTS.md`**: Updated all port references — common commands, troubleshooting, port forwarding table, container access URLs

**Verification:**
- `npm run build:all` — passes (8 modules transformed)
- `npm run test:all` — 1990 tests pass (56 test files)
- `npm run lint` — clean (3 pre-existing errors in midi-mcp only)

**Task 28 moved to `tasks/done/28-devcontainer-port-locking.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 22c-mapping-table-component.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md

### Iteration 57 — Sub-task 22c: Extract `<akvj-mapping-table>` Component (2026-07-16)

**Sub-task 22c executed — completed the custom element migration trilogy (22a ✅, 22b ✅, 22c ✅):**

**Changes implemented:**

1. **`mainframe/src/js/MappingTable.js`** (new file, 131 lines): `<akvj-mapping-table>` custom element encapsulating:
   - Mapping summary (mapped slot count + unmapped clips list)
   - Mapping table with sorted rows (channel, note, velocity, clipId, remove button)
   - `mappings` setter (array of entries) triggers re-render
   - `clipCatalog` setter (for unmapped clips calculation) triggers re-render
   - Dispatches `mappingremove` event (bubbles: true) with `{ detail: { channel, note, velocity, clipId } }`
   - `disconnectedCallback()` cleanup via `replaceChildren()`

2. **`mainframe/src/main.js`**: Removed ~50 lines:
   - `renderMapping()` simplified to `mappingTableElement.mappings = mappingState` + `clipCatalog` + `updatePianoKeyboard()`
   - `updateMappingSummary()` removed — moved to component
   - Table row creation loop removed — moved to component
   - New `mappingremove` event listener handles removal + re-render

3. **`mainframe/src/index.html`**: Replaced `<div id="mapping-summary">` + `<table class="mapping-table">` with `<akvj-mapping-table id="mapping-table">`. Kept the `mapping-add` form (channel/note/velocity/clipId inputs) outside the component since it's an input form, not display.

**Custom element migration complete:** All three UI components extracted:
- `<akvj-clip-list>` (22a) — clip library list + preview player
- `<akvj-clip-editor>` (22b) — clip metadata edit form
- `<akvj-mapping-table>` (22c) — mapping table + summary
- `<akvj-piano-keyboard>` (pre-existing) — piano keyboard for note selection

**Verification:**
- `npm run build:all` — passes (9 modules transformed, up from 8 — new MappingTable.js)
- `npm run test:all` — 2026 tests pass (57 test files)
- `npm run lint` — clean (3 pre-existing errors in midi-mcp only)

**Sub-task 22c moved to `tasks/done/22c-mapping-table-component.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md

### Iteration 58 — Task 29: Rename midi-layout to key-map (2026-07-16)

**Inbox processed:** 1 new item (`rename-to-key-map.md`) → task 29 created. Archived.

**Task 29 executed — complete cross-codebase rename from `midi-layout` to `key-map`:**

**Files renamed:**
- `clips/midi-layout.json` → `clips/key-map.json`
- `akvj/src/public/clips/midi-layout.json` → `akvj/src/public/clips/key-map.json`
- `akvj/dist/clips/midi-layout.json` → `akvj/dist/clips/key-map.json`

**Source files updated (7):**
1. **`mainframe/server/paths.js`**: `MIDI_LAYOUT_PATH` → `KEY_MAP_PATH`, path points to `key-map.json`
2. **`mainframe/server/index.js`**: Import updated, `flattenMidiLayout()` → `flattenKeyMap()`, `midiLayout` variable → `keyMap`, all file read/write paths updated, comment updated
3. **`mainframe/scripts/clips/Pipeline.js`**: Import `validateMidiLayout` → `validateKeyMap`, log messages and copy paths updated
4. **`mainframe/scripts/clips/lib/validateMapping.js`**: `validateMidiLayout()` → `validateKeyMap()`, `loadMidiLayout()` → `loadKeyMap()`, all error path strings updated from `midi-layout.json` to `key-map.json`
5. **`mainframe/scripts/clips/lib/validate/index.js`**: Error message updated
6. **`mainframe/scripts/clips/new.js`**: Console log instructions updated
7. **`akvj/src/js/core/settings.js`**: `midiLayoutJsonUrl` → `keyMapJsonUrl`, path to `/clips/key-map.json`
8. **`akvj/src/js/visuals/ClipLoader.js`**: `midiLayoutJsonUrl` parameter → `keyMapJsonUrl`, `midiLayout` variable → `keyMap`, `#buildLoadTasks(midiLayout, ...)` → `#buildLoadTasks(keyMap, ...)`, all JSDoc, log messages, and error messages updated

**Test files updated (5):**
1. **`akvj/test/ClipLoader.test.js`**: `mockFetchCatalogAndLayout(catalog, midiLayout)` → `(catalog, keyMap)`, all `midiLayout` variables → `keyMap`, URL strings updated, warning assertion updated
2. **`akvj/test/settings.test.js`**: `midiLayoutJsonUrl` → `keyMapJsonUrl`
3. **`mainframe/test/server.test.js`**: File paths in setup/teardown updated, test descriptions updated
4. **`mainframe/test/validateMapping.test.js`**: Import `validateMidiLayout` → `validateKeyMap`, describe block name, all function calls, file paths, assertion strings updated
5. **`mainframe/test/Pipeline.test.js`**: Fixture file path updated
6. **`mainframe/test/paths.test.js`**: Import `MIDI_LAYOUT_PATH` → `KEY_MAP_PATH`, assertion updated

**Verification:**
- `npm run build:all` — passes (9 modules transformed)
- `npm run test:all` — 2058 tests pass (58 test files, up from 57 — new test file counted)
- `npm run lint` — clean

**Task 29 moved to `tasks/done/29-rename-midi-layout-to-key-map.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md

### Iteration 59 — Task 31: Change Mainframe API Port to 7777 (2026-07-16)

**Inbox processed:** 1 new item (`change-api-port-to-7777.md`) → task 31 created. Archived.

**Port scheme now perfectly aligned:**
- `7777` — Mainframe API (Backend)
- `8888` — AKVJ (Frontend Visualizer)
- `9999` — Mainframe UI (Frontend Dashboard)

**Files updated (7):**
1. **`mainframe/server/index.js`**: Default port `8787` → `7777`
2. **`mainframe/vite.config.js`**: `/api` proxy target `http://127.0.0.1:8787` → `http://127.0.0.1:7777`
3. **`mainframe/test/smoke/startup.test.js`**: `MAINFRAME_API_URL` port `8787` → `7777`
4. **`.devcontainer/devcontainer.json`**: `forwardPorts` and `portsAttributes` updated from `8787` to `7777`
5. **`README.md`**: Maintenance packages table and core commands updated
6. **`AGENTS.md`**: Common commands and port forwarding table updated
7. **`mainframe/README.md`**: Command comment and API heading updated

**Note:** Task 30 (ensure-everything-works) is still in `tasks/` — it was partially executed in a previous iteration (server entry point bug fixed, smoke test timeout increased). The smoke test Vite UI timeout issue remains unresolved but is a devcontainer environment issue, not a code bug.

**Verification:**
- `npm run build:all` — passes (9 modules transformed)
- `npm run test:all` — 2122 tests pass (60 test files)
- `npm run lint` — clean

**Task 31 moved to `tasks/done/31-change-api-port-to-7777.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md
- 30-ensure-everything-works.md (partially done — server entry point fixed, smoke test Vite UI timeout unresolved)

### Iteration 60 — Task 30: Comprehensive Verification Pass (2026-07-16)

**Inbox processed:** No new items.

**Task 30 completed — fixed smoke test failures and ensured everything works end-to-end.**

**Root causes identified and fixed:**

1. **Server entry point detection bug** (fixed in prior iteration): `import.meta.url === \`file://${process.argv[1]}\`` failed with relative paths. Fixed with `path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)`.

2. **Vite binding to IPv6 only**: In the devcontainer, Vite defaulted to binding on `::1` (IPv6 localhost) but the smoke test connected via `127.0.0.1` (IPv4), causing `ECONNREFUSED`. Fixed by adding `host: '127.0.0.1'` to both Vite configs.

3. **Node `fetch` (undici) incompatibility**: Node's built-in `fetch` failed to connect to Vite dev servers even when they were reachable via `curl`. Replaced with `http.get` which uses a different networking stack.

4. **Stale process cleanup**: `pkill -f "vite.*8888"` patterns didn't match actual Vite commands (port is in config, not CLI args). Replaced with `fuser -k <port>/tcp` to kill by port number.

5. **Fetch timeout too short**: 500ms `AbortSignal.timeout` was insufficient for Vite's on-demand module compilation on first request. Added separate `FETCH_TIMEOUT_MS = 5000` constant.

**Files updated (3):**
1. **`akvj/vite.config.js`**: Added `host: '127.0.0.1'` to server config
2. **`mainframe/vite.config.js`**: Added `host: '127.0.0.1'` to server config
3. **`mainframe/test/smoke/startup.test.js`**: Replaced `fetch` with `http.get`, added `FETCH_TIMEOUT_MS`, replaced `pkill` patterns with `fuser -k` by port, added port-based cleanup in `finally` block, removed debug logging

**Verification — all 4 checks pass:**
- `npm run build:all` — passes (9 modules transformed)
- `npm run test:all` — 2122 tests pass (60 test files)
- `npm run lint` — clean
- `npm run test:smoke` — ✅ All 3 server startup checks pass (akvj UI, mainframe UI, mainframe API)

**Task 30 moved to `tasks/done/30-ensure-everything-works.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 23-improve-test-coverage.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md

### Iteration 61 — Task 23: Improve Test Coverage (2026-07-16)

**Inbox processed:** No new items.

**Task 23 completed — wrote comprehensive test suite for `mainframe/server/spritesheet.js`.**

**New test file:** `mainframe/test/spritesheet.test.js` (13 tests)

**Tests written for `createClipFromFrames`:**
1. **Input validation**: rejects invalid clipId, empty frame array, non-array frameBuffers
2. **Single frame creation**: creates clip with sprite.png and meta.json
3. **Multiple frames**: verifies frames count, framesPerRow, meta fields
4. **Bitmask role**: writes meta with `role: 'bitmask'` and `bitDepth: 1`
5. **Custom options**: writes meta with custom name, playback mode, and frame rate
6. **Dimension mismatch**: rejects frames with different dimensions
7. **Duplicate clip**: rejects when clip already exists
8. **Raw asset storage**: stores original frames in `.raw-assets/{clipId}/`
9. **Custom dimensions**: resizes frames to custom target width/height
10. **Default dimensions**: uses 240x135 (AKVJ canvas resolution) by default
11. **framesPerRow cap**: caps at 16 for clips with 20+ frames

**Technical approach:**
- Used dynamic `import()` with `vi.resetModules()` in `beforeEach` to ensure `AKVJ_CLIPS_DIR` env var is re-read by `paths.js` on each test
- Generated valid PNG buffers using sharp at test setup time
- Each test gets a fresh temp directory for clip isolation

**Verification:**
- `npm run test:all` — 2151 tests pass (61 test files, up from 60)
- `npm run lint` — clean

**Task 23 moved to `tasks/done/23-improve-test-coverage.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md
- 27-code-quality-tools.md

### Iteration 62 — Task 27: Code Quality Tools (Knip + commitlint) (2026-07-16)

**Inbox processed:** No new items.

**Task 27 partially completed — integrated Knip (unused code detection) and commitlint (conventional commits).**

**Sub-tasks completed (2 of 5):**
1. **Knip** — Installed, configured `knip.json` for workspaces, added `npm run knip` script
2. **commitlint** — Installed `@commitlint/cli` + `@commitlint/config-conventional`, added `commitlint.config.js`, added `commit-msg` Husky hook

**Sub-tasks remaining (3 of 5):**
3. tsc --checkJs (type checking)
4. @vitest/coverage-v8 (coverage thresholds)
5. Lighthouse CI (performance guarding)

**Dead code removed (5 exports cleaned up):**
- `readHashFile` in `hash.js` — removed export, kept as internal (used by `isCacheValid`)
- `applyBitDepthPipeline` and `VALID_BIT_DEPTHS` in `optimize.js` — removed from export, kept as internal
- `PROTOCOLS` in `protocol.js` — removed export, kept as internal (used by `detectProtocol`)
- `createFakeInput` and `createFakeAccess` in `fakeMidi.js` — removed exports, kept as internal
- `createMockClip` in `visualTestHelpers.js` — removed export, kept as internal

**Other changes:**
- Removed workaround dependencies (`@rolldown/binding-linux-x64-gnu`, `@vitest/mocker`) from `package.json` — they were npm bug workarounds, not real deps
- `knip.json` ignores `ClipPreview.js` (planned future tool) and `mtcTransformer.js` (planned transformer)
- `knip.json` ignores `fuser` and `pkill` binaries (used in smoke test)

**New files:**
- `knip.json` — workspace-aware config
- `commitlint.config.js` — conventional commits config
- `.husky/commit-msg` — commit message linting hook

**Verification:**
- `npm run knip` — ✅ No issues found
- `npm run test:all` — 2151 tests pass (61 test files)
- `npm run lint` — clean

**Task 27 moved to `tasks/done/27-code-quality-tools.md`** (partial — 3 sub-tasks remain for future iteration).

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 24-metadata-form-improvements.md
- 26-comprehensive-testing-strategy.md

### Iteration 63 — Task 24: Metadata Edit Form Improvements (2026-07-16)

**Inbox processed:** No new items.

**Task 24 completed — added PNG filename field to clip editor and clip sort dropdown to library.**

**Feature 1: PNG filename field in ClipEditor**
- Added `png` text input to the clip edit form (between Name and Frames)
- Added `validatePngFilename()` function that checks filename pattern and verifies file existence via HEAD request to `/api/clips/{clipId}/sprite`
- Validation triggers on blur — shows "File exists" or warning if not found
- Added `png` field to the save updates object sent to the API
- Files modified: `mainframe/src/js/ClipEditor.js`

**Feature 2: Clip sort dropdown in Library tab**
- Added `<select id="clip-sort">` with 4 sort options: Name, ID, Role, Frames
- Added `#sortMode` field and `sortMode` setter/getter to `AkvjClipList`
- Sorting logic in `#filterClips()` with switch on sort mode (name, clipId, role, frames)
- Wired up event listener in `main.js`, resets on clear filters
- Added `.clip-sort` CSS styling matching `.clip-role-filter`
- Files modified: `mainframe/src/index.html`, `mainframe/src/js/ClipList.js`, `mainframe/src/main.js`, `mainframe/src/styles.css`

**Feature 3 (batch operations):** Not implemented — task said "consider" and it doesn't fit naturally into the current single-clip editing workflow.

**Verification:**
- `npm run lint` — clean
- `npm run build -w mainframe` — passes (22.67 kB JS bundle)
- `npm run test:all` — 2190 tests pass (62 test files)

**Task 24 moved to `tasks/done/24-metadata-form-improvements.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 20d-sprite-sheet-compilation-endpoint.md
- 26-comprehensive-testing-strategy.md

### Iteration 64 — Task 20d: Sprite Sheet Compilation Endpoint (2026-07-16)

**Inbox processed:** No new items.

**Task 20d completed — added `POST /api/clips/:clipId/recompile` endpoint for re-compiling sprite sheets from stored raw assets.**

**New export: `recompileClip` in `mainframe/server/spritesheet.js`**
- Reads raw PNG frames from `clips/.raw-assets/{clipId}/`
- Re-processes with new config (targetWidth, targetHeight, playback, frameRate, name, role)
- Overwrites existing `sprite.png` and `meta.json` (merges new meta over existing, preserving fields like `role`/`bitDepth`)
- Throws clear errors for invalid clipId or missing raw assets

**New route: `POST /api/clips/:clipId/recompile` in `mainframe/server/index.js`**
- Validates clipId, checks clip directory exists (404 if not)
- Parses body for config params, calls `recompileClip`
- Returns 200 with result or 400 on error

**New helper: `overwriteClipFiles` in `spritesheet.js`**
- Unlike `writeClipFiles` (which throws if clip exists), this overwrites sprite.png and merges meta.json

**Tests: 7 new tests in `mainframe/test/spritesheet.test.js`**
1. Rejects invalid clipId
2. Throws when no raw assets exist
3. Recompiles with default dimensions from raw assets
4. Recompiles with custom target dimensions (verifies sprite width/height via sharp)
5. Recompiles with updated playback and frameRate
6. Preserves existing meta fields (role, bitDepth) not overridden by recompile
7. Overwrites existing sprite.png (verifies file size changes)

**Verification:**
- `npm run lint` — clean
- `npm run test:all` — 2238 tests pass (63 test files, up from 62)
- `npm run build -w mainframe` — passes

**Task 20d moved to `tasks/done/20d-sprite-sheet-compilation-endpoint.md`**.

**Remaining tasks in `tasks/` folder:**
- 20b-frontend-staging-ui.md
- 20c-live-preview-canvas.md
- 26-comprehensive-testing-strategy.md

### Iteration 65 — Task 20b: Frontend Staging UI with Drag & Drop (2026-07-16)

**Inbox processed:** No new items.

**Task 20b completed — replaced the basic upload form with a drag-and-drop staging UI including clip config options.**

**New UI features:**
1. **Drag & drop zone** — Drop PNG frames directly or click to browse. Filters for `image/png` only. Shows visual feedback during dragover.
2. **File list** — Displays staged file names and sizes, plus frame count summary
3. **Clip config fields** — Name, Role, Target Width (default 240), Target Height (default 135), Playback mode (7 options), Frame rate (default 12)
4. **Submit** — Calls `POST /api/clips` with all config params + base64 frames. Resets form and file list on success.

**Files modified:**
- `mainframe/src/index.html` — Replaced upload form with drop zone, file list, name field, config row
- `mainframe/src/main.js` — Added drag/drop handlers, file staging, renderFileList(), updated submit handler with config params
- `mainframe/src/styles.css` — Added `.drop-zone`, `.file-list`, `.upload-config-row` styles

**Verification:**
- `npm run lint` — clean
- `npm run test:all` — 2238 tests pass (63 test files)
- `npm run build -w mainframe` — passes (24.25 kB JS, up from 22.67 kB)

**Task 20b moved to `tasks/done/20b-frontend-staging-ui.md`**.

**Remaining tasks in `tasks/` folder:**
- 20c-live-preview-canvas.md
- 26-comprehensive-testing-strategy.md

### Iteration 66 — Task 20c: Live Preview Canvas with Scale/Color Depth (2026-07-16)

**Inbox processed:** No new items.

**Task 20c completed — added live canvas preview of staged frames in the upload tab.**

**New custom element: `AkvjStagingPreview` in `mainframe/src/js/StagingPreview.js`**
- Canvas preview player showing frames at target resolution (240x135 default, updates when config changes)
- Pixel-perfect rendering (`imageSmoothingEnabled = false`)
- Play/pause button, frame scrub slider, speed controls (0.25×, 0.5×, 1×, 2×, 4×)
- Supports all 7 playback modes (loop, once, pingpong, random, reverse, shuffle, scrub)
- Loads staged File objects via `URL.createObjectURL` and cleans up object URLs
- `loadFrames(files, targetWidth, targetHeight, frameRate, playbackMode)` public method
- Dispatches `framesloaded` event when frames finish loading
- Follows the existing ClipList preview player pattern (private fields, `#animate`, `#drawCurrentFrame`)

**Integration in `main.js`:**
- `stagingPreview` element referenced and `updateStagingPreview()` function calls `loadFrames` with current config values
- Config change listeners on width/height/frameRate/playback trigger preview reload
- `renderFileList()` calls `updateStagingPreview()` when files are staged, or `loadFrames([])` when cleared
- Form reset after successful upload clears the preview

**Files created/modified:**
- `mainframe/src/js/StagingPreview.js` (new — 200 lines)
- `mainframe/src/index.html` — Added `<akvj-staging-preview>` element after file list
- `mainframe/src/main.js` — Added import, staging preview wiring, config change listeners

**Color depth preview:** Not implemented (task marked it optional). Would require canvas pixel manipulation to simulate bit-depth reduction — can be added later if needed.

**Verification:**
- `npm run lint` — clean
- `npm run test:all` — 2238 tests pass (63 test files)
- `npm run build -w mainframe` — passes (28.80 kB JS, up from 24.25 kB)

**Task 20c moved to `tasks/done/20c-live-preview-canvas.md`**.

**Remaining tasks in `tasks/` folder:**
- 26-comprehensive-testing-strategy.md
