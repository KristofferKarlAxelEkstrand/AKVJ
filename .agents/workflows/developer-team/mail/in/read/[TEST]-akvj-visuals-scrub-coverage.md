# [TEST] AKVJ visuals — scrub position coverage gaps

Area: `akvj/src/js/visuals/` — scrub playback / CC control

Sweep date: 2026-07-19

## Findings

The `scrub` playback mode is supported by `PlaybackController`, `Clip`, `LayerGroup`, `MaskManager`, and `LayerManager`, but the chain from `Clip.setScrubPosition` up through the CC handler is only partially tested.

### 1. `Clip.setScrubPosition` is not tested

**File:** `akvj/src/js/visuals/Clip.js:288-290`

`setScrubPosition` is a public method that forwards to `this.#playback.setScrubPosition(normalizedValue)`. `PlaybackController.setScrubPosition` has its own unit tests, but the `Clip` facade is never exercised. A regression that broke the method (e.g., not calling playback, passing un-clamped value, throwing) would not be caught.

**Suggested test (unit):**
- Create a `Clip` with `playback: 'scrub'`.
- Call `clip.setScrubPosition(0.5)`.
- Assert `clip.currentFrame` maps to the expected frame index for the clip length (e.g., 4 frames → frame 2).
- Test clamping: `setScrubPosition(-0.1)` → frame 0; `setScrubPosition(1.1)` → last frame.

### 2. `LayerGroup.setScrubPosition` is not tested

**File:** `akvj/src/js/visuals/LayerGroup.js:226-232`

The method iterates over `#activeClips` and calls `clip.setScrubPosition` only when `clip.playbackMode === 'scrub'`. It is not covered in `LayerGroup.test.js`.

**Suggested test (unit):**
- Create a `LayerGroup` with a mix of active clips: one `playbackMode === 'scrub'`, one `loop`.
- Call `layerGroup.setScrubPosition(0.5)`.
- Assert the scrub clip's `setScrubPosition` was called with `0.5` and the loop clip was not touched.

### 3. `LayerManager` scrub CC handling is not tested

**File:** `akvj/src/js/visuals/LayerManager.js:74-84`

`LayerManager.handleControlChange` maps CCs 16-19 (`settings.scrub.*_CC`) to `setScrubPosition` on the layer groups and mask manager. `LayerManager.test.js` only tests `noteOn`/`noteOff` and velocity selection; it does not test `handleControlChange` for scrub.

**Suggested test (unit):**
- Mock `LayerGroup`/`MaskManager` instances or spy on `setScrubPosition`.
- Call `layerManager.handleControlChange(16, 64)` (CC 16 is `layerGroupA_CC`; value 64 → normalized 0.5).
- Assert `layerGroupA.setScrubPosition(0.5)` was called.
- Assert the other layer groups and mask manager were not called.
- Repeat for CCs 17, 18, 19.

## Tier

Unit (`akvj/test/Clip.test.js`, `LayerGroup.test.js`, `LayerManager.test.js`). No source changes needed.
