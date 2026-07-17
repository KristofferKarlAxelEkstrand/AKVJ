# [BUG] Compositor allocates ImageData objects every frame during mask mixing

## Severity: Medium (Performance)

## Location
`akvj/src/js/visuals/Compositor.js:203-216` — `#mixWithMask()`

## Description
Every frame that a mask is active, `#mixWithMask()` calls `getImageData()` three times (for layerGroupA, layerGroupB, and mask), creating three new `ImageData` objects. While `#mixedImageData` is correctly cached, the three input `ImageData` objects are freshly allocated each frame, creating GC pressure.

The `#pixelBuffers` object stores references to the `.data` arrays, but the parent `ImageData` objects themselves are not reused — they become garbage after each frame.

## Impact
At 60fps with a 240x135 canvas (32,400 pixels), this creates 3 temporary `ImageData` objects per frame. Each is ~129KB (32,400 × 4 bytes). That's ~387KB of garbage per frame, or ~23MB/sec of GC pressure.

## Recommendation
Cache the three `ImageData` objects as instance fields (like `#mixedImageData` already is). Reuse them by calling `ctx.getImageData()` into the cached objects, or better yet, use `ctx.getImageData()` once and cache the `ImageData` for each context, only refreshing when the context is drawn to.

Alternatively, since the canvas dimensions are fixed, pre-allocate all `ImageData` objects in the constructor and use `putImageData`/`getImageData` with cached references.
