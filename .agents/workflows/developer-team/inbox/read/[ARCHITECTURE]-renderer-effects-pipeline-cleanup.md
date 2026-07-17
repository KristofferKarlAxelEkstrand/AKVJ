# [ARCHITECTURE] Renderer does not destroy EffectsPipeline on teardown

## Severity: Low (Resource cleanup)

## Location
`akvj/src/js/visuals/Renderer.js:121-136` — `destroy()`

## Description
The `Renderer.destroy()` method destroys the `Compositor` but does not destroy the `EffectsPipeline`:

```javascript
destroy() {
    try { this.stop(); } catch (error) { ... }
    this.#displayContext = null;
    this.#layerManager = null;
    try { this.#compositor?.destroy(); } catch (error) { ... }
    this.#compositor = null;
    this.#effectsPipeline = null;  // Just nulled, not destroyed
}
```

`EffectsPipeline` doesn't currently have a `destroy()` method, but it holds a `#scratchBuffer` (Uint8ClampedArray) that could be explicitly released. While nulling the reference allows GC, not having a `destroy()` method is inconsistent with the pattern used by `Compositor`, `LayerManager`, `MaskManager`, etc.

## Impact
Low — the scratch buffer will be GC'd. But the inconsistency in cleanup patterns is a code quality issue.

## Recommendation
Add a `destroy()` method to `EffectsPipeline` that nulls the scratch buffer and effect context, and call it from `Renderer.destroy()`.
