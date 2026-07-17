# Task 40: Fix Compositor ImageData Per-Frame Allocation

## Severity: Medium (Performance)

## Location
`akvj/src/js/visuals/Compositor.js:203-216` — `#mixWithMask()`

## Problem
Every frame that a mask is active, `#mixWithMask()` calls `getImageData()` three times (for layerGroupA, layerGroupB, and mask), creating three new `ImageData` objects. While `#mixedImageData` is correctly cached, the three input `ImageData` objects are freshly allocated each frame, creating GC pressure.

At 60fps with a 240x135 canvas (32,400 pixels), this creates ~387KB of garbage per frame, or ~23MB/sec of GC pressure.

## Fix
Cache the three `ImageData` objects as instance fields (like `#mixedImageData` already is). Pre-allocate them in the constructor and reuse them each frame.

### Options (from the bug report):
1. Cache `ImageData` objects as instance fields and reuse them
2. Use `ctx.getImageData()` once and cache the `ImageData` for each context, only refreshing when the context is drawn to
3. Pre-allocate all `ImageData` objects in the constructor (canvas dimensions are fixed)

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Verify the render loop still produces correct visual output
- Confirm no new `ImageData` allocations happen per-frame (can add a dev-mode assertion)

## Key Files
- `akvj/src/js/visuals/Compositor.js` — the file to fix
- `akvj/test/Compositor.test.js` — existing tests to verify

## Constraints
- Do NOT change the visual output — only optimize the allocation pattern
- Maintain 60fps performance requirement
- Follow private field naming conventions (`#`)

## Dependencies
- None (but was discovered during Task 37a code review)
