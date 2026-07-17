# Task 64: Revert Compositor ImageData Caching (Task 40)

## Severity: Medium (Performance regression)

## Location
`akvj/src/js/visuals/Compositor.js` — `#mixWithMask()` and `#initOffscreenCanvases()`

## Problem
The optimization in Task 40 (caching `ImageData` objects and copying pixels via `.set()`) is a net negative:

1. `getImageData()` always allocates a new `ImageData` with a new `Uint8ClampedArray` — this cannot be avoided with standard 2D Canvas API
2. The `.set()` copy adds CPU overhead on top of the existing allocation cost
3. GC churn is identical (the temporary `ImageData` from `getImageData()` is still created and discarded)
4. The cached arrays are in old generation, but the temporary ones are still in young generation — no GC benefit

## Fix
Revert `Compositor.js` to its previous state where `getImageData()` results are assigned directly to `#pixelBuffers`:

```javascript
this.#pixelBuffers.layerGroupA = this.#ctxA.getImageData(...).data;
```

Remove the cached `ImageData` instance fields (`#layerGroupAImageData`, `#layerGroupBImageData`, `#maskImageData`) and the `.set()` copy logic. Let V8's young-generation GC handle the short-lived arrays — this is faster than redundant byte-copies.

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify visual output is unchanged
- Confirm 60fps performance is maintained (or improved by removing the copy overhead)

## Key Files
- `akvj/src/js/visuals/Compositor.js` — revert changes from Task 40
- `akvj/test/Compositor.test.js` — existing tests

## Constraints
- This is a REVERT of Task 40 — remove the caching, not add more optimization
- Do NOT change the visual output
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 40 ✅ Complete (but needs reverting)
- Found by QA Reviewer during audit of Task 40
