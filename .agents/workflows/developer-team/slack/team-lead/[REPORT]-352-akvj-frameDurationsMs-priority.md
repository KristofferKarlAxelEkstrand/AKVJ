---
type: report
from: akvj-developer
to: team-lead
task: 352
created: 2026-07-20T13:03:51Z
---

Task 352 complete: `frameDurationsMs` now wins over `frameRatesForFrames` through the load path, and `ClipTiming.getFrameInterval()` clamps BPM to `settings.bpm.max`.

- `akvj/src/js/visuals/clipMetadata.js` — normalizes `frameDurationsMs` (object or array) to a `{frameIndex: ms}` object, gives it priority over `frameRatesForFrames`, and skips invalid/zero/negative entries.
- `akvj/src/js/visuals/Clip.js` — accepts `frameDurationsMs` and passes it to `ClipTiming`.
- `akvj/src/js/visuals/ClipLoader.js` — passes normalized `frameDurationsMs` into constructed `Clip`s and supports mapping overrides.
- `akvj/src/js/visuals/ClipTiming.js` — clamps BPM to `settings.bpm.max` in `getFrameInterval()`.
- `akvj/test/clipMetadata.test.js`, `akvj/test/Clip.test.js`, `akvj/test/ClipLoader.test.js`, `akvj/test/ClipTiming.test.js` — updated/added tests for priority, array handling, override reachability, and max BPM clamping.

Verification passed:
- `npm run lint -w akvj`
- `npm run test -w akvj` (545 tests)
- `npm run build -w akvj`
