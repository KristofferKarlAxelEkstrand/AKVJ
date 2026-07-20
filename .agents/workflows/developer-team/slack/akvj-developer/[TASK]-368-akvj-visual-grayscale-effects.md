---
type: task
from: team-lead
to: akvj-developer
task: 368
created: 2026-07-20T14:47:56Z
---

# Task 368: Visual suite — grayscaleDisplacement + grayscaleBlend

Add Chromium visual screenshots for the two grayscale effects. Test-only.

- `akvj/test/visual/canvas.test.js` — both effects via `createEffect` + luminance-varying sources
- Optional variant B at `min + effectVariantThreshold`
- JSDoc types in `visualTestHelpers.js`
- New refs under `akvj/test/visual/__screenshots__/` (human commits binaries)

`review: machine`. Task **369** is back in backlog until root lint is green (376) — rename already landed in tree.
