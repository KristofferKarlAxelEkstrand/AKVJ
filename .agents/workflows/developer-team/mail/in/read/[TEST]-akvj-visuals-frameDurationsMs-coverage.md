---
type: test
from: test-marshal
created: 2026-07-20T12:55:00Z
---

# [TEST] AKVJ `frameDurationsMs` regression tests

Companion to `.agents/workflows/developer-team/mail/in/[BUG]-akvj-clip-timing-frameDurationsMs-drift-2026-07-20.md`. The product fix should land with tests that lock the corrected priority and clamping. Current `akvj/test/clipMetadata.test.js:366-374` codifies the wrong priority (`frameRatesForFrames` over `frameDurationsMs`), so that test needs to be flipped.

## Checklist

- `akvj/test/clipMetadata.test.js` — **unit (akvj/jsdom)**
  - Update the existing priority test: `frameDurationsMs` wins over `frameRatesForFrames`.
  - Add: `normalized.frameDurationsMs` is preserved as a `{ frameIndex: ms }` object when present (after filtering zero/negative entries).
  - Add: invalid/zero/negative entries in `frameDurationsMs` are skipped, not converted to `Infinity`/negative FPS.
  - Add: empty `frameDurationsMs` results in `null` for both `frameDurationsMs` and `frameRatesForFrames`.

- `akvj/test/Clip.test.js` — **unit (akvj/jsdom)**
  - Add: `Clip` constructor accepts `frameDurationsMs` and passes it to `ClipTiming`.
  - Add: a clip with both `frameRatesForFrames` and `frameDurationsMs` advances using the ms intervals (e.g. 50ms, 100ms) not the FPS-derived intervals.
  - Add: `Clip` handles `frameDurationsMs: null` / missing without throwing.

- `akvj/test/ClipLoader.test.js` — **unit (akvj/jsdom)**
  - Add: metadata containing `frameDurationsMs` is preserved through normalization and the constructed `Clip` uses ms timing.
  - Add: mapping overrides can supply `frameDurationsMs` and it reaches the `Clip`.

- `akvj/test/ClipTiming.test.js` — **unit (akvj/jsdom)**
  - Add: `getFrameInterval` clamps BPM to `settings.bpm.max` in beat mode (line 116 only clamps to `min`).
  - Add: a `bpmProvider` returning a value above `settings.bpm.max` is clamped, and the interval matches the max-clamped value.

## Tier notes

All changes are unit tests in the existing jsdom Vitest setup. No product code changes by the Test Marshal.
