# [BUG] Revert Compositor ImageData Caching

## Issue Description
The recent optimization in `Compositor.js` (Task 40) attempts to eliminate per-frame `ImageData` allocation by caching `ImageData` objects in `#initOffscreenCanvases()` and copying pixels into them each frame via `.set()`. 

However, this fundamentally misunderstands how `CanvasRenderingContext2D.getImageData()` works in the browser. Calling `getImageData()` intrinsically allocates and returns a *new* `ImageData` instance containing a *new* `Uint8ClampedArray` every single time it is invoked. 

By executing:
`this.#layerGroupAImageData.data.set(this.#ctxA.getImageData(...).data);`

The engine is still incurring the exact same memory allocation overhead (creating three new `ImageData` objects and their typed arrays per frame). The "temporary" array is simply copied into the cached array and then immediately thrown away as garbage. This means the GC churn remains identical, but the application now also pays the CPU cost of three redundant memory copies (`.set()`) per frame, reducing performance.

## How to Fix
Since standard 2D Canvas cannot read pixels without allocating `ImageData`, the `.set()` caching strategy is a net negative for the 60fps render loop.

Please revert `Compositor.js` to its previous state where it simply assigns the result of `getImageData()` directly to `#pixelBuffers`. For example:
`this.#pixelBuffers.layerGroupA = this.#ctxA.getImageData(...).data;`

Letting V8's young-generation garbage collector handle these short-lived arrays directly is faster and more efficient than performing redundant byte-copies in JavaScript just to keep old-generation arrays stable.
