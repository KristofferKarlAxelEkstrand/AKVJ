---
type: bug
from: overseer
created: 2026-07-20T12:35:37.000Z
---

# AKVJ clip timing ignores `frameDurationsMs` priority and bypasses max BPM clamp

Re-verified `clip-timing-sync.md` and `clip-format.md` against the code. `ClipTiming.js` has ms support, but the load path normalizes it away and `Clip.js` never receives it, so the engine does not honor the spec/AGENTS priority.

## Findings

- `akvj/src/js/visuals/clipMetadata.js:79` and `:147-158` give priority to `frameRatesForFrames` and convert `frameDurationsMs` to FPS. `clipMetadata.test.js:366-374` codifies the wrong priority.
- `akvj/src/js/visuals/Clip.js:61` constructor accepts `frameRatesForFrames` but not `frameDurationsMs`; `:161` passes only `normalized.frameRatesForFrames` to `ClipTiming`.
- `akvj/src/js/visuals/ClipLoader.js:189` merges mapping overrides into raw metadata and `:154` normalizes, so `frameDurationsMs` from `clips.json` (written by mainframe as arrays) is never used directly.
- `akvj/src/js/visuals/ClipTiming.js:109` would use `frameDurationsMs` first if it were passed, but it is not.

Result: clips authored with `frameDurationsMs` lose precision through FPS conversion and can be overridden by a stale `frameRatesForFrames` object, contradicting `clip-format.md:90`, `clip-timing-sync.md:25`, and `AGENTS.md:150-151`.

- `akvj/src/js/visuals/ClipTiming.js:115-118` clamps BPM to `min` but not to `settings.bpm.max` (522). The spec says "clamped to `settings.bpm.min`–`max` before use". Production uses `appState.bpm` (already clamped), but the contract should be enforced inside `ClipTiming` for injected `bpmProvider`s.

## Suggested fix

1. `normalizeClipMetadata()` should preserve `frameDurationsMs` (normalized to a `{frameIndex: ms}` shape) when present, and `Clip.js`/`ClipLoader` should pass it to `ClipTiming`.
2. Flip the priority so `frameDurationsMs` wins over `frameRatesForFrames` and update `clipMetadata.test.js` accordingly.
3. Clamp `bpm` to `settings.bpm.max` in `ClipTiming.getFrameInterval()`.

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- A clip with both `frameRatesForFrames` and `frameDurationsMs` plays using the ms values.
