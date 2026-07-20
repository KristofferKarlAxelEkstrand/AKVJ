---
status: backlog
assignee: none
priority: low
---

# 415 — Renderer / Compositor naming and JSDoc nits

From `[NIT]-renderer-compositor-2026-07-20b.md` (nitpicker). No behaviour change.

**Sequencing:** must land after task 411, which rewrites buffer handling in
`akvj/src/js/visuals/effects/grayscaleBlendEffect.js` and `EffectsPipeline.js`. Do not start this
while 411 is open.

## `akvj/src/js/visuals/Compositor.js`

- `idx` → `byteOffset` in `#mixPixels1Bit`, `#mixPixelsMultiBit`, `#mix1Bit`, `#mixMultiBit`,
  `#blendPixel` (L272-314). `i` is the pixel index; `idx` is `i * 4`, a byte offset into RGBA.
- `#mix1Bit` → `#mixPixel1Bit`, `#mixMultiBit` → `#mixPixelMultiBit` (L287, L295) — singular vs
  the plural loop methods, so the loop/body split is visible.
- `#ensurePixelBuffers` JSDoc (L238-240) says "Called whenever the canvas dimensions change"; it
  runs every frame via `#mixWithMask`. Reword to: called from the constructor and before every
  masked mix, reallocating only when dimensions change.
- `#layerGroupAData` / `#layerGroupBData` / `#maskData` → `…Pixels`. These alias the same arrays as
  `#pixelBuffers.layerGroupA` etc. — if they are strictly redundant, say so and drop one set rather
  than renaming both.

## `akvj/src/js/visuals/Renderer.js`

- `#clearCanvas(ctx)` (L83) → `#fillCanvasBackground(ctx)`; it paints
  `settings.rendering.backgroundColor` rather than clearing. `Compositor.#clearMixedCanvas` has the
  same shape — rename both or neither.
- L212: move `this.#effectRenderContext.bpm = this.#bpmProvider.bpm;` out of
  `#compositeLayerGroups` into `#applyEffectsAndOverlay`. Confirm the two calls stay in the same
  frame order so no frame of BPM is lost.

## `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`

- L152 `getBitDepthParams` collides by name with `Compositor.js:300` `#getBitDepthParams` — same
  return shape, different lookup tables. Rename the effect-local one (`grayscaleBlendParamsFor` or
  similar).

## Verify

- `npm run lint && npm run test && npm run test:visual` — pixel output must not change.
