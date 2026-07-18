# Team Update: Refactor Audit — akvj (Post-Epic, Post-Tasks 134–142)

## Summary
Audit pass over akvj source for new structural/naming/coupling findings since the refactor epic (Tasks 119–127). Focused on `Clip.js`, `clipMetadata.js`, user-message system, and event-driven communication. Proposals only — no implementation.

## Findings

### 1. `Clip.js` — draw rect logic should extract to a `ClipRenderer` helper
**File:** `akvj/src/js/visuals/Clip.js` (356 lines, up from ~247 pre-Task 142)
**Problem:** `Clip` was split into a thin render facade in Task 119 (timing → `ClipTiming`, playback → `PlaybackController`), but Task 142 added ~110 lines of draw-rect computation (`#computeDrawRect`, `#drawScaled`, `#drawPattern`) plus the `snapToPixel` helper. The class now mixes three concerns: playback lifecycle, frame advancement, and pixel-level draw-rect math for 5 scale modes. The draw-rect logic is pure math (no instance state beyond `#frameWidth`/`#frameHeight`/`#canvasWidth`/`#canvasHeight`/`#scaleMode`/`#placement`) and could be a standalone `ClipRenderer` module or a set of pure functions in a `clipDrawRect.js` utility.
**Proposal:** Extract `#computeDrawRect` + `#drawScaled` + `#drawPattern` + `snapToPixel` into `akvj/src/js/visuals/clipDrawRect.js` as pure functions taking `(sourceWidth, sourceHeight, targetWidth, targetHeight, scaleMode, placement)`. `Clip.#drawToContext` becomes a 3-line branch that calls the right function. This mirrors the existing `frameFit.js` pattern in mainframe and keeps `Clip` a thin facade. **Priority: medium** — not urgent, but prevents drift back to god-module territory if more scale modes or effects are added.

### 2. `clipMetadata.js` — approaching comfortable capacity, not yet a problem
**File:** `akvj/src/js/visuals/clipMetadata.js` (242 lines)
**Problem:** Grew from ~100 lines (pre-Task 136) to 242 with sync expansion (Task 136: `resolveFrameDurationBeats`, `expandSyncToFrameDurationBeats`, `resolveTotalBeats`, `computeFrameWeights`, `PRESET_BEATS`, `PRESET_BARS`) and placement resolution (Task 142: `resolvePlacement`). All functions are private module-level helpers, well-focused, single-responsibility. The file is still readable and linear.
**Assessment:** Not yet a god-module. The sync expansion and placement resolution are each self-contained sections. If more metadata fields are added (e.g. per-mapping overrides, grayscale effects), consider splitting into `clipMetadata/syncExpansion.js` and `clipMetadata/placement.js` sub-modules. **Priority: low** — no action needed now, just flag for future.

### 3. `snapToPixel` is a private function in `Clip.js` — should be a shared utility
**File:** `akvj/src/js/visuals/Clip.js:12`
**Problem:** The whole-pixel rule is engine-wide per the spec (`clip-upload-edit-feature.md` §11), but `snapToPixel` is a file-private function in `Clip.js`. If any other module needs to snap draw coordinates (e.g. `Compositor.js`, effects, future placement-aware mask blending), it would need to re-implement `Math.floor()`.
**Proposal:** Move `snapToPixel` to `akvj/src/js/utils/pixelUtils.js` (or `akvj/src/js/utils/snapToPixel.js`) and import where needed. Keeps the engine-wide constraint centralized. **Priority: low** — only one consumer today, but the spec says "engine-wide."

### 4. Custom element naming inconsistency: `user-messages` vs `akvj-loading-overlay`
**Files:** `akvj/src/js/ui/UserMessages.js` (defines `<user-messages>`), `akvj/src/js/ui/LoadingOverlay.js` (defines `<akvj-loading-overlay>`)
**Problem:** `LoadingOverlay` uses an `akvj-` prefixed tag name, but `UserMessages` and `UserMessage` use bare `user-messages`/`user-message`. The `akvj-` prefix is the established convention for akvj-owned custom elements (also `adventure-kid-video-jockey`). Bare names risk collisions with future third-party elements.
**Proposal:** Rename to `<akvj-user-messages>` and `<akvj-user-message>`. Update the tag registration, `AdventureKidVideoJockey.js` instantiation, CSS selectors, and tests. Low-risk rename. **Priority: medium** — naming consistency per `code-standards.md`.

### 5. `UserMessage.js` — `MESSAGE_TYPES` duplicated between `UserMessage.js` and `AppState.js`
**Files:** `akvj/src/js/ui/UserMessage.js:1` (`MESSAGE_TYPES = new Set(['error', 'warning', 'info'])`), `akvj/src/js/core/AppState.js:23` (`USER_MESSAGE_TYPES = new Set(['error', 'warning', 'info'])`)
**Problem:** Two identical sets with different names. If a new type is added (e.g. `'success'`), both must be updated independently.
**Proposal:** Export `USER_MESSAGE_TYPES` from `AppState.js` and import it in `UserMessage.js`, or extract to a shared `akvj/src/js/ui/userMessageTypes.js`. Prefer importing from `AppState.js` since that's the dispatch source. **Priority: low** — small duplication, but violates DRY.

### 6. `UserMessages.js` — `#boundFocusIn` listener on `document` is aggressive for a VJ app
**File:** `akvj/src/js/ui/UserMessages.js:28`
**Problem:** `UserMessages` installs a capture-phase `focusin` listener on `document` to trap focus inside the top message. This is correct for accessibility, but `goal.md` says akvj should have "essentially no user interface" and run fullscreen. The focus trap is only active when messages are shown (`#items.length > 0` check), which is good, but the listener itself is always attached while the element is connected.
**Assessment:** Acceptable for now — the guard clause short-circuits when no messages are shown, and the listener is removed on `disconnectedCallback`. No action needed unless profiling shows overhead. **Priority: none** — documenting as reviewed.

### 7. `AppState.js` — `EVENT_USER_MESSAGE` not exported alongside other event constants
**File:** `akvj/src/js/core/AppState.js:22`
**Problem:** `EVENT_USER_MESSAGE` is defined as a module-level const and exported, but it's not grouped with the other event constants in the export block at the bottom of the file. `UserMessages.js` imports it directly: `import appState, { EVENT_USER_MESSAGE } from '../core/AppState.js'`. This works but is inconsistent — other consumers import events from the named export block.
**Assessment:** Minor inconsistency. The export works correctly. Not worth a separate task. **Priority: none** — cosmetic.

### 8. `Midi.js` — `appState.error()` call couples MIDI layer to user-message UI
**File:** `akvj/src/js/midi-input/Midi.js:73`
**Problem:** `#handleMIDIFailure` calls `appState.error(...)` directly, which dispatches `EVENT_USER_MESSAGE`. This is correct per the event-driven architecture (MIDI failure → AppState event → `<user-messages>` renders), but the error message text includes UI-level guidance ("Use Chrome/Chromium with MIDI enabled") which is a presentation concern living in the MIDI input layer.
**Assessment:** Acceptable — the message is helpful and the coupling is through the event bus, not a direct UI reference. The text could be moved to a constants file if more MIDI error messages are added. **Priority: none** — documenting as reviewed.

### 9. `UserMessages.test.js` — stale element cleanup is fragile
**File:** `akvj/test/UserMessages.test.js:48-53`
**Problem:** The `beforeEach` manually removes stale `<user-messages>` elements left by prior test files. This is needed because `AdventureKidVideoJockey.test.js` creates a `<user-messages>` element that may persist in the JSDOM `document.body` across test files. The cleanup works but is a symptom of test isolation not being enforced by the test framework configuration.
**Proposal:** Consider adding a global `afterEach` in the vitest setup file that clears `document.body` between test files, or use Vitest's `unstubGlobals` / `restoreAllMocks` more aggressively. This would remove the need for the manual cleanup hack. **Priority: low** — test infrastructure improvement.

## Summary of Priorities
- **Medium:** #1 (Clip.js draw-rect extraction), #4 (custom element naming consistency)
- **Low:** #2 (clipMetadata.js — no action yet), #3 (snapToPixel utility), #5 (MESSAGE_TYPES duplication), #9 (test isolation)
- **None (documented as reviewed):** #6, #7, #8

## Notes
- All findings are post-epic (Tasks 119–127) and post-recent features (Tasks 134–142).
- No findings overlap with the already-completed refactor epic slices.
- `Clip.js` at 356 lines is still under the pre-split 493 lines, but the draw-rect logic is the main growth area and is the cleanest extraction candidate.
