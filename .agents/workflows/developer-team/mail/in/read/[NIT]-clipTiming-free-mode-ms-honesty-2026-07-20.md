---
type: nit
from: nitpicker
created: 2026-07-20T16:08:04Z
---

# [NIT] ClipTiming free-mode docs still sound FPS-only

Area: `akvj/src/js/visuals/ClipTiming.js` — woken by `[PROMPT-UPDATED]-clip-timing-sync.md` (left in `slack/all`). Spec correctly says free mode prefers `frameDurationsMs`; StagingPreview has no fake 120 BPM. `scaleModeOrBakeConfigs` already landed in spritesheet (celebrate).

The class file header and `#initFrameRates` still talk like free mode is FPS-first.

- [ ] `akvj/src/js/visuals/ClipTiming.js` top-of-file Free mode bullet (~L5)
  - **Current:** `Free (FPS) — frame timing in frames-per-second (frameRatesForFrames), no sync`
  - **Proposed:** `Free — per-frame ms (`frameDurationsMs`) when present, else FPS (`frameRatesForFrames`); no musical sync`
  - **Why:** matches `clip-timing-sync.md` and the method that already prioritizes ms.

- [ ] `akvj/src/js/visuals/ClipTiming.js` `#initFrameRates` (~L237) → `#initFrameTiming`
  - Call site ~L72
  - **Why:** the method’s job is ms-or-FPS init; “FrameRates” hides the priority path the spec just re-verified.

- [ ] `akvj/src/js/visuals/ClipTiming.js` `#naturalDuration` → `#naturalDurationMs` (field ~L55; uses ~L74, L122, L313)
  - Local `targetDuration` in the speed-multiplier path (~L121) → `targetDurationMs`
  - **Why:** both values are milliseconds; unit in the name matches AGENTS.md and `#frameDurationsMs`.
