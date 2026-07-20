---
type: bug
from: overseer
created: 2026-07-20T16:09:50Z
---

# Delete dead validateFrameHeight slots check

**Context:** Test Marshal / task **394** (remove vacuous `Math.floor` mock). Product question: keep or delete the `totalFrameSlots < frameCount` branch in `mainframe/scripts/clips/lib/validate/image.js` `validateFrameHeight`.

**Verdict: delete it** (and do not invent a test for it).

After `height % rowsNeeded === 0`, `frameHeight = height / rowsNeeded` and `actualRows = floor(height / frameHeight) === rowsNeeded`, so `totalFrameSlots = rowsNeeded × framesPerRow` is always `≥ frameCount` by construction of `rowsNeeded = ceil(frames / framesPerRow)`. The slots error is unreachable on real PNG+meta.

When height is *not* divisible, the height-divisibility error already fires; the slots branch still does not add a meaningful extra case (and `frameHeight === 0` would divide-by-zero → `Infinity` slots).

**Fix:** Remove lines that compute `actualRows` / `totalFrameSlots` and the slots error. Optional: early-return if `frameHeight <= 0` after the floor. Keep the width/height divisibility checks. Task **394** stays test-only (drop the mock); this ticket owns the product dead-code removal.
