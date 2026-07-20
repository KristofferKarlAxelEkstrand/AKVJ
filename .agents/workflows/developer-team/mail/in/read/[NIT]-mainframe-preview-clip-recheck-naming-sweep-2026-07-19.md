# [NIT] PreviewClip re-check naming/semantics sweep

Area: `mainframe/src/js/` new stable files (`PreviewClip.js`, `mainframe/test/PreviewClip.test.js`, `mainframe/test/ClipFramesUploadPanel.test.js`)

Prior nits from `[NIT]-mainframe-new-widgets-naming-sweep-2026-07-19.md` look resolved: `acceptedImageFiles.js` constants are now wired into `ClipFramesUploadPanel.js`, `data` is now `clipData`, the misleading `playbackend` event is now `playbackended`, `elapsed` is now `elapsedMs`, and the public API now has JSDoc coverage. `ClipFramesUploadPanel.js` and both test files are clean. `PreviewClip.js` has a few new naming/semantics nits that surfaced after the first pass.

## Findings

### 1. `PreviewClip.js` private helpers shadow built-in `Element` methods
- **File**: `mainframe/src/js/PreviewClip.js` (lines 452–459, 461–473)
- **Current**:
  - `#setAttribute(name, value)`
  - `#toggleAttribute(name, shouldExist)`
- **Proposed**:
  - `#setAttributeIfChanged(name, value)`
  - `#toggleAttributeIfChanged(name, shouldExist)`
- **Rationale**: Naming a private helper exactly `setAttribute`/`toggleAttribute` is misleading because `Element.prototype.setAttribute` and `Element.prototype.toggleAttribute` already exist on the same object. The helpers are conditional wrappers (`if (this.getAttribute(name) === value) return;`), so `IfChanged` makes the "only write when different" behavior explicit and avoids readers conflating them with the native DOM methods.

### 2. `PreviewClip.js` `#getFrameInterval()` returns milliseconds but omits the unit suffix
- **File**: `mainframe/src/js/PreviewClip.js` (lines 297–299)
- **Current**: `#getFrameInterval()`
- **Proposed**: `#getFrameIntervalMs()`
- **Rationale**: The method returns `(this.#durationsMs[this.#currentFrame] ?? FALLBACK_MS) / this.#speed`, which is a millisecond duration. The codebase has been moving toward unit-honest names (`durationsMs`, `elapsedMs`, `FALLBACK_MS`) so `Ms` makes the return unit obvious at the call site (e.g., `elapsedMs >= this.#getFrameIntervalMs()`).

### 3. `PreviewClip.js` boolean state field `#loading` is inconsistent with `#isPlaying`
- **File**: `mainframe/src/js/PreviewClip.js` (lines 34, 235, 238, 269)
- **Current**: `#loading`
- **Proposed**: `#isLoading`
- **Rationale**: The class already uses the `is` prefix for booleans (`#isPlaying`, `#updatingAttribute`). Renaming `#loading` to `#isLoading` keeps the boolean-guard naming consistent and makes the guard clause `if (!this.#clipId || this.#isLoading)` read like a predicate.

## Celebrations

- `PreviewClip.js` otherwise has excellent unit honesty (`durationsMs`, `FALLBACK_MS`, `elapsedMs`) and clear private-field naming (`#shuffleState`, `#pingpongState`, `#currentFrame`).
- The public API (`play`, `pause`, `stop`, `setSpeed`) now has helpful JSDoc, and the attribute↔property synchronization via `#updatingAttribute` is a tidy guard.
- `ClipFramesUploadPanel.js` is admirably small and focused, with no state and a clean `connectedCallback`/`disconnectedCallback` pair.
