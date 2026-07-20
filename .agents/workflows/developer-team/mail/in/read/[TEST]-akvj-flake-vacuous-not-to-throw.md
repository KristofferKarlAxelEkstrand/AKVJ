# [TEST] Flake hunt: vacuous `not.toThrow()` assertions in akvj effects and Clip tests

Area: `akvj/test/` — flake / trustworthiness sweep

Sweep date: 2026-07-19

## Findings

Three tests only assert that code does not throw, without verifying the actual outcome. These would pass if the implementation silently did nothing.

### 1. `akvj/test/effects.test.js` — glitch effect with too-small scratch

**File:** `akvj/test/effects.test.js:430-437`

Test name: `allocates new buffer when scratch is too small`

Current assertions:
```js
expect(() => glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: smallScratch })).not.toThrow();
```

`glitchEffect.apply` returns a boolean and mutates `img.data`. When the supplied scratch buffer is too small, the implementation allocates a new `Uint8ClampedArray` (see `akvj/src/js/visuals/effects/glitchEffect.js:25`). The test does not verify that the result is `true` or that `img.data` was actually modified.

**Action:** Mirror the large-scratch test above it:
- `expect(result).toBe(true);`
- `expect(img.data).not.toEqual(originalPixels);`
- Optionally verify `smallScratch` is left untouched.

### 2. `akvj/test/Clip.test.js` — invalid `frameRatesForFrames` fallback

**File:** `akvj/test/Clip.test.js:197-210`

Test name: `falls back to default frame rate when all rates invalid`

Current assertions:
```js
expect(() => clip.renderToContext(ctx)).not.toThrow();
```

The test sets `frameRatesForFrames: { 0: 0, 1: 'x' }` and advances `performance.now()` from `0` to `1000`. The expected behavior is that Clip falls back to a default numeric frame rate and advances frames. The current assertion only ensures no exception; it would pass if `renderToContext` early-returned.

**Action:**
- `expect(ctx.drawImage).toHaveBeenCalled();`
- `expect(clip.currentFrame).toBeGreaterThan(0);` (or an exact expected frame index for the default 12 FPS interval over 1000ms).

### 3. `akvj/test/Clip.test.js` — `frameRatesForFrames: null`

**File:** `akvj/test/Clip.test.js:212-225`

Test name: `handles frameRatesForFrames: null without throwing`

Current assertions:
```js
expect(clip).toBeInstanceOf(Clip);
expect(() => clip.renderToContext(ctx)).not.toThrow();
```

This verifies construction and that rendering does not throw, but not that the clip actually renders with the default frame rate when `frameRatesForFrames` is `null`.

**Action:**
- `expect(ctx.drawImage).toHaveBeenCalled();`
- Verify `clip.currentFrame` remains or advances as expected for the default frame rate.

## Tier

Unit (`akvj/test/`). No source changes needed.
