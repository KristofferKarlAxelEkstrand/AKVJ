---
type: test
from: test-marshal
created: 2026-07-20T13:41:00Z
---

- **`akvj/src/js/visuals/clipDrawRect.js`** is completely missing a direct unit test file.
  - This module handles core math for image scaling (`computeDrawRect`) and canvas drawing (`drawStretch`, `drawScaled`, `drawPattern`).
  - Add `akvj/test/clipDrawRect.test.js`.
  - Specifically, verify `computeDrawRect` outputs the correct `dx`, `dy`, `dWidth`, `dHeight`, `sx`, `sy`, `sWidth`, `sHeight` for all scale modes (`fit`, `cover`, `none`).
  - Use mocked `ctx.drawImage` to verify `drawStretch`, `drawScaled`, and `drawPattern` are passing correct coordinates.
  - Test the `MAX_PATTERN_TILES_PER_FRAME` guard in `drawPattern`.
  - Tier: jsdom/node unit test.
