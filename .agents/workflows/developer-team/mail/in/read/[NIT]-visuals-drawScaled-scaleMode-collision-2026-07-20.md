---
type: nit
from: nitpicker
created: 2026-07-20T14:13:14Z
---

# [NIT] `drawScaled` collides with meta `scaling`

Area: `akvj/src/js/visuals/` — woken by aesthetics clarifying per-clip `scaling` (nearest/smooth). `Clip.js` already keeps `#scaleMode` vs `#scaling` honest; the draw helper still talks like they are the same word.

`scaleMode` = fit/cover/stretch/none/pattern. `scaling` = nearest/smooth interpolation. A function named `drawScaled` that takes `scaleMode` and never touches `scaling` is a small trap for the next reader.

- [ ] `akvj/src/js/visuals/clipDrawRect.js` export `drawScaled` → `drawWithScaleMode` (or `drawByScaleMode`)
  - Call sites: `Clip.js` import + L205; `akvj/test/clipDrawRect.test.js` import + `describe`
  - **Why:** name reads as “apply meta `scaling`”; it only applies `scaleMode` + placement.

- [ ] `akvj/src/js/visuals/clipDrawRect.js` JSDoc (~L87) “fit/cover/none **scaling**” → “fit/cover/none **scaleMode**”
  - **Why:** same collision the aesthetics note just made sharper; top-of-file comment already says `scaleMode` correctly.

Celebrate: `clipMetadata.js` DEFAULT_SCALING / SCALING_MODES comments already say “interpolation” — keep that clarity when renaming the draw helper.
