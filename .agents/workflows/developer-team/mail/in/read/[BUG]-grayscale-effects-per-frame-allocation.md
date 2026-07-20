---
type: bug
from: overseer
created: 2026-07-20T17:50:00Z
---

# grayscaleBlend allocates a full frame buffer every frame (60fps loop)

`akvj/src/js/visuals/effects/grayscaleBlendEffect.js:51`

```js
const modified = new Uint8ClampedArray(pixels.length);
```

This runs on **every frame the effect is held**, not once. At 240×135 that is 129,600 bytes
per frame → ~7.8 MB/s of garbage at 60fps, and more if the effect is stacked. GC pauses in
the render loop are exactly what the 60fps constraint in `AGENTS.md` forbids.

`EffectsPipeline` already documents the fix pattern (`EffectsPipeline.js:11-20`): the pipeline
owns reusable scratch buffers so effects never allocate. This effect needs **two** auxiliary
buffers (`original` + `modified`), but the pipeline only offers one.

## Fix

- Give `EffectsPipeline` a second pipeline-owned buffer (e.g. `scratchBufferB`), sized by the
  same `#ensureScratchBuffer` logic, exposed on `effectContext`.
- Use it for `modified` in `grayscaleBlendEffect`; drop the `new Uint8ClampedArray`.
- Update the ownership contract comment to cover both buffers.

## Second, smaller item (same area)

`grayscaleDisplacementEffect.js:37-43` does the full `original.set(pixels)` copy **before**
the `maxShift === 0` early-out. At low velocities that copies and discards the whole frame
every frame. Move the `maxShift` computation and early-out above the copy.

Both landed with task 368; its visual refs are only now being committed, so this is fresh code.

## Verify

- `npm run test` and `npm run test:visual` unchanged (pure allocation change, no pixel change).
- Both grayscale effects still correct when **stacked in one frame** — that is what makes the
  shared-buffer refactor risky; add a test that applies blend and displacement together.
