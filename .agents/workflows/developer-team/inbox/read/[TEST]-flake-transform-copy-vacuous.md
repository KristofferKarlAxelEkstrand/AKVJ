# [TEST] akvj — transformCopy scratch buffer tests assert only not.toThrow() without verifying transformation

**From:** Test Marshal  
**Area:** `akvj/test/effects.test.js` lines 303-329  
**Date:** 2026-07-18  
**Tier:** unit  
**Type:** Flake risk — vacuous assertion  

## Summary

Two `transformCopy` tests assert only `not.toThrow()` without verifying that the pixel
transformation actually occurred. These tests could pass even if `transformCopy` silently
did nothing when the scratch buffer is null or too small.

## Findings

### 1. "allocates scratch buffer when not provided" (line 303)

```js
test('allocates scratch buffer when not provided', () => {
    const pixels = new Uint8ClampedArray(BYTE_COUNT);
    const swapFn = (x, y) => (y * WIDTH + (WIDTH - 1 - x)) * RGBA_CHANNEL_COUNT;
    expect(() => transformCopy(pixels, WIDTH, HEIGHT, null, swapFn)).not.toThrow();
});
```

**Problem:** The test name claims to verify scratch buffer allocation, but:
- Does not check that pixels were actually transformed (swapFn is a horizontal mirror)
- Does not check the return value (`transformCopy` always returns `true`)
- Does not check any pixel values after the call

**How it could pass for the wrong reason:** If `transformCopy` returned early when
`scratchBuffer` is null (doing nothing), the test would still pass.

### 2. "allocates new buffer when scratch is too small" (line 323)

```js
test('allocates new buffer when scratch is too small', () => {
    const pixels = new Uint8ClampedArray(BYTE_COUNT);
    const smallScratch = new Uint8ClampedArray(4); // too small
    const identityFn = (x, y) => (y * WIDTH + x) * RGBA_CHANNEL_COUNT;
    expect(() => transformCopy(pixels, WIDTH, HEIGHT, smallScratch, identityFn)).not.toThrow();
});
```

**Problem:** Same pattern — test name claims to verify new buffer allocation, but:
- Does not check that pixels were actually transformed
- Does not check that a new buffer was allocated (as opposed to just returning early)
- Uses `identityFn` which is a no-op transform, so even if the function runs, it can't
  distinguish between "ran correctly" and "did nothing"

**How it could pass for the wrong reason:** If `transformCopy` returned early when
scratch is too small (doing nothing), the test would still pass. The identityFn makes
it even worse — even if the function runs, the output equals the input.

## Contrast with the good test

The test at line 309 ("uses provided scratch buffer when large enough") is correct:
```js
transformCopy(pixels, WIDTH, HEIGHT, scratch, swapFn);
expect(pixels[0]).toBe(3);  // Verifies actual pixel transformation
```

## Fix

Both tests should verify pixel values after transformation, like the test at line 309.
Use a non-identity transform function and assert specific pixel values.

## Related

Same pattern as `[TEST]-flake-glitch-scratch-buffer-vacuous.md` which covers
`glitchEffect` scratch buffer test at line 401.
