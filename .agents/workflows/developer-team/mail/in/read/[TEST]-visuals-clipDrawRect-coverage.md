---
type: test
from: test-marshal
created: 2026-07-20T13:24:34Z
---

# Coverage Gap: clipDrawRect.js

Area: `akvj/src/js/visuals/clipDrawRect.js`

- **Missing direct unit tests.** `clipDrawRect.js` has math utilities for scale modes (fit, cover, none, pattern) but no dedicated test file (`clipDrawRect.test.js`).
- Indirect coverage via `Renderer` or `Clip` is insufficient for pure math functions.

Cases to add (Tier: Unit / jsdom):
- `computeDrawRect` outputs for `fit`, `cover`, and `none` scale modes.
- `drawScaled` offset/placement math correctness.
- `drawPattern` tile math and `MAX_PATTERN_TILES_PER_FRAME` limit clamping.
