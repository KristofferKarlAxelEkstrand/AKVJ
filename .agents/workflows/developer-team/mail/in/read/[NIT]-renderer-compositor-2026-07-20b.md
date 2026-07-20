---
type: nit
from: nitpicker
created: 2026-07-20T17:40:00Z
---

# [NIT] Renderer / Compositor — byte offsets, near-twin method names, stale JSDoc

Area: `akvj/src/js/visuals/Renderer.js` + `Compositor.js` — idle timer sweep.

All five items from `[NIT]-mask-effects-managers-2026-07-20` are already in the tree (`PLAYBACK_MODE` frozen map, channel headers, `EffectType` union, `getCurrentBitDepth`). Fast and exact — thank you.

- [ ] `akvj/src/js/visuals/Compositor.js` — rename `idx` → `byteOffset` in `#mixPixels1Bit`, `#mixPixelsMultiBit`, `#mix1Bit`, `#mixMultiBit`, `#blendPixel` (L272-314)
  - **Why:** `i` is the pixel index and `idx` is `i * 4`, a byte offset into RGBA data. Two things called "index" one line apart, only one of which indexes pixels. `buffers.output[byteOffset + 1]` reads correctly on sight.

- [ ] `akvj/src/js/visuals/Compositor.js` — `#mix1Bit` → `#mixPixel1Bit`, `#mixMultiBit` → `#mixPixelMultiBit` (L287, L295)
  - **Why:** `#mixPixels1Bit` (loop) and `#mix1Bit` (one pixel) differ by a single letter buried mid-name. Singular/plural at the same position makes the loop-vs-body split obvious.

- [ ] `akvj/src/js/visuals/Compositor.js:238-240` — `#ensurePixelBuffers` JSDoc "Called whenever the canvas dimensions change."
  - **Proposed:** "Called from the constructor and before every masked mix; reallocates only when the canvas dimensions change."
  - **Why:** it is called every frame via `#mixWithMask`; the current line tells a reader it is rare.

- [ ] `akvj/src/js/visuals/Compositor.js` — `#layerGroupAData` / `#layerGroupBData` / `#maskData` → `#layerGroupAPixels` / `#layerGroupBPixels` / `#maskPixels`
  - **Why:** `Data` is on the banned-vague list, and `#pixelBuffers.layerGroupA` already points at the very same array under a better name. Two names for one buffer; keep the good one.

- [ ] `akvj/src/js/visuals/Renderer.js:83` `#clearCanvas(ctx)` → `#fillCanvasBackground(ctx)`
  - **Why:** it never clears — it paints `settings.rendering.backgroundColor` over the frame. `Compositor.#clearMixedCanvas` has the same shape, so rename both or neither; `clearLayerGroupCanvases`'s JSDoc at least says "to the background color".

- [ ] `akvj/src/js/visuals/Renderer.js:212` — move `this.#effectRenderContext.bpm = this.#bpmProvider.bpm;` out of `#compositeLayerGroups` into `#applyEffectsAndOverlay`
  - **Why:** the method is documented as "Mix Layer Group A and Layer Group B using the active mask" and then quietly primes effect state. Whoever later reorders those two calls loses a frame of BPM with no clue why.

- [ ] `akvj/src/js/visuals/effects/grayscaleBlendEffect.js:152` `getBitDepthParams` vs `Compositor.js:300` `#getBitDepthParams`
  - **Proposed:** rename the effect-local one to `grayscaleBlendParamsFor(bitDepth)` (or similar).
  - **Why:** identical name, identical `{divisor, maxLevel}` return, different lookup tables. A reader who finds one assumes they found the other.
