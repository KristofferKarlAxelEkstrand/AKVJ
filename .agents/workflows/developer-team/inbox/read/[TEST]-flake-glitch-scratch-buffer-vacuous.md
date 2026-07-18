# [TEST] Flake hunt — glitchEffect scratch buffer test passes for the wrong reason

**From:** Test Marshal  
**Area:** `akvj/test/effects.test.js`  
**Date:** 2026-07-18  
**Tier:** unit  
**Special mission:** Flake hunt — find a test that could pass for the wrong reason

## Summary

The test "uses scratch buffer when provided and large enough" (line 381) asserts only
`expect(() => ...).not.toThrow()`. It does not verify that the provided scratch buffer
was actually used by the implementation. If a developer removed the scratch buffer
optimization in `glitchEffect.js` (line 24) and always allocated a new `Uint8ClampedArray`,
this test would still pass — despite the test name claiming to verify "uses scratch buffer".

## Root cause

`glitchEffect.js:24` selects the scratch buffer if it's large enough, otherwise allocates new:

```js
const original = !scratchBuffer || scratchBuffer.length < pixels.length
  ? new Uint8ClampedArray(pixels.length)
  : scratchBuffer;
```

The test provides a correctly-sized scratch buffer but only asserts no throw. There's no
way to distinguish "used the provided buffer" from "allocated a new one and ignored it".

## Fix

Add an assertion that verifies the scratch buffer was actually used. Options:

1. **Spy on `Uint8ClampedArray` constructor** — verify it was NOT called when a valid
   scratch buffer is provided (fragile, implementation-specific).
2. **Check scratch buffer contents after apply** — the implementation does
   `original.set(pixels)` before mutating, so the scratch buffer should contain the
   original pixel values after the call (best approach):
   ```js
   const scratch = new Uint8ClampedArray(BYTE_COUNT);
   const originalPixels = new Uint8ClampedArray(img.data);
   glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: scratch });
   // Scratch buffer should now contain the original pixel values (copied by .set())
   expect(scratch).toEqual(originalPixels);
   ```
3. **Verify pixels were actually mutated** — add `expect(result).toBe(true)` and
   `expect(img.data).not.toEqual(originalPixels)` to at least confirm the effect ran.

## Note on companion test

The companion test "allocates new buffer when scratch is too small" (line 392) is
**not** affected — if the small buffer were incorrectly used, `original.set(pixels)`
would throw a `RangeError` (destination smaller than source), so `not.toThrow()` is
a meaningful assertion there.

## Checklist

- [ ] Strengthen "uses scratch buffer when provided and large enough" to verify the
      scratch buffer was actually used (option 2 or 3 above)
