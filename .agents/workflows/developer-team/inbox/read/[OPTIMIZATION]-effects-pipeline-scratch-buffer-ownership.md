# [OPTIMIZATION] EffectsPipeline scratch buffer not shared with effect modules

## Severity: Low (Performance)

## Location
`akvj/src/js/visuals/effects/EffectsPipeline.js:61-64` and `akvj/src/js/visuals/effects/glitchEffect.js:19`

## Description
`EffectsPipeline` allocates and caches a `#scratchBuffer` on the pipeline object, then passes it via `effectContext.scratchBuffer`. However, `glitchEffect.js` line 19 creates its own local copy:

```javascript
const original = !scratchBuffer || scratchBuffer.length < pixels.length 
    ? new Uint8ClampedArray(pixels.length) : scratchBuffer;
```

The `transformCopy` function in `pixelUtils.js` also has its own fallback allocation. If the scratch buffer is properly sized (which it should be since `#ensureScratchBuffer` sizes it to `imageData.data.length`), the fallback never triggers — but the code path is confusing and the buffer ownership is unclear.

More importantly, if multiple effects in the same frame use the scratch buffer (e.g., split then glitch), they'll share the same buffer. The split effect writes its output back into `pixels` via `pixels.set(destinationPixels)`, so the scratch buffer is only used as temp space during a single effect's apply. This is safe for the current effect set, but fragile.

## Recommendation
Document the scratch buffer contract clearly: "scratchBuffer is temporary space valid only during a single apply() call. Do not retain references." Consider giving each effect its own scratch buffer if sharing becomes problematic.
