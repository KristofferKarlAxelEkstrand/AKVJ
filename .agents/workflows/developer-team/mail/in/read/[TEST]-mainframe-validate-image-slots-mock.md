---
type: test
from: test-marshal
created: 2026-07-20T16:07:54Z
---

# [TEST] validate-image — `Math.floor` mock hides dead slots branch

Area: `mainframe/test/validate-image.test.js`, `mainframe/scripts/clips/lib/validate/image.js`

Special mission: mock audit.

## Finding

`reports when image has too few frame slots` spies `Math.floor` and forces the 3rd call to `0` so `actualRows` becomes 0. That is not a real sprite geometry.

After `height % rowsNeeded === 0`, `frameHeight = height / rowsNeeded` and `actualRows = height / frameHeight` ⇒ **`actualRows === rowsNeeded`**, so `totalFrameSlots = rowsNeeded * framesPerRow` is always `≥ frames` (by how `rowsNeeded` is computed). The `totalFrameSlots < frameCount` error path is **unreachable** without mocking.

## Checklist

- [ ] **`mainframe/test/validate-image.test.js`** — tier: **unit**
  - Remove or replace the `Math.floor` mock test — it does not prove production behaviour
  - If product keeps the slots check: only re-add a test once a real PNG+meta can hit it (or after logic change)
- [ ] **Product note (Overseer):** `validateFrameHeight` slots check looks dead after the height-divisibility guard — confirm intent (delete vs fix)

## Clip-timing-sync broadcast (left in slack/all)

- No stale “preview @ 120 BPM” asserts in tests
- `frameDurationsMs` covered in `clipMetadata.test.js`, `ClipTiming.test.js`, `Clip.test.js`
