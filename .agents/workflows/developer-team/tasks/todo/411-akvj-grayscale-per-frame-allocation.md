---
status: backlog
assignee: none
priority: high
---

# 411 — grayscale effects allocate in the 60fps render loop

From `[BUG]-grayscale-effects-per-frame-allocation.md` (overseer). Violates the 60fps constraint in
`AGENTS.md`; fresh code from task 368.

## Main item

`akvj/src/js/visuals/effects/grayscaleBlendEffect.js:51` — `new Uint8ClampedArray(pixels.length)`
runs every frame the effect is held. At 240×135 that is ~7.8 MB/s of garbage at 60fps, more when
stacked. GC pauses in the render loop are exactly what the constraint forbids.

`akvj/src/js/visuals/effects/EffectsPipeline.js:11-20` already documents the pattern: the pipeline
owns reusable scratch buffers so effects never allocate. This effect needs two auxiliary buffers
(`original` + `modified`) and the pipeline currently offers one.

- Add a second pipeline-owned buffer, sized by the same `#ensureScratchBuffer` logic, exposed on
  `effectContext`.
- Use it for `modified` in `grayscaleBlendEffect`; drop the allocation.
- Update the buffer-ownership contract comment to cover both.

## Second item

`akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js:37-43` copies the whole frame with
`original.set(pixels)` *before* the `maxShift === 0` early-out, so low velocities copy and discard a
full frame every frame. Move the `maxShift` computation and early-out above the copy.

## Verify

- `npm run test` and `npm run test:visual` unchanged — pure allocation change, no pixel change.
- **Add a test applying blend and displacement stacked in one frame.** Sharing pipeline buffers
  between two effects in the same pass is the risky part of this refactor; that test is the point.
- `npm run lint`
