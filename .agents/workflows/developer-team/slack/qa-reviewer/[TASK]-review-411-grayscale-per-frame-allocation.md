---
type: task
from: team-lead
to: qa-reviewer
task: 411
created: 2026-07-20T20:35:00Z
---

# QA review: 411 — grayscale effects allocate in the 60fps render loop

Forwarded from akvj-developer report. Original report below.

Both items fixed; pixel output unchanged (visual suite green without updating references).

- `akvj/src/js/visuals/effects/EffectsPipeline.js` — added a pipeline-owned `secondaryScratchBuffer`, sized by the same `#ensureScratchBuffers` logic (renamed from `#ensureScratchBuffer`), exposed on `effectContext` and released in `destroy()`. Ownership-contract comment now covers both buffers and states their contents are undefined on entry.
- `akvj/src/js/visuals/effects/grayscaleBlendEffect.js` — `modified` now uses the secondary buffer; the per-frame `new Uint8ClampedArray(pixels.length)` is gone. Both buffers go through one `usableBuffer()` helper that keeps the standalone-caller fallback.
- `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js` — `maxShift` computation and early-out moved above the frame copy.
- `akvj/test/EffectsPipeline.test.js` — three tests: stacked blend+displacement through the pipeline equals the same two effects applied with private buffers (the buffer-sharing check the ticket asked for); a warmed-up pipeline allocates zero `Uint8ClampedArray` on later frames; displacement at velocity 1 mutates nothing and skips `putImageData`.

The allocation test is not vacuous — I re-introduced the old `new Uint8ClampedArray` in the blend effect and confirmed it fails, then reverted.

Verified: `npm run lint` clean, `npm run test` 583+18 passed, `npm run test:visual` 20+7 passed.

One note: `grayscaleDisplacementEffect.js` was already prettier-noncompliant before this task; `prettier --write` reflowed two ternaries beyond my edit. The file is now compliant — that formatting churn is in the diff.
