---
status: in-progress
assignee: akvj-developer
priority: medium
---

# Task 307: AKVJ flake hunt — vacuous `not.toThrow()` assertions

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/[TEST]-akvj-flake-vacuous-not-to-throw.md`

## Description

Strengthen three akvj tests that only assert `not.toThrow()` so they verify the actual rendered outcome instead of silently passing on no-ops.

## Findings and actions

### 1. `akvj/test/effects.test.js` — glitch effect with too-small scratch

**File:** `akvj/test/effects.test.js` (lines 430–437)

**Test:** `allocates new buffer when scratch is too small`

**Current:**
```js
expect(() => glitchEffect.apply(img, { velocity: 127 }, 0, { ...EFFECT_CONTEXT, scratchBuffer: smallScratch })).not.toThrow();
```

**Action:**
- Capture `result`.
- `expect(result).toBe(true);`
- `expect(img.data).not.toEqual(originalPixels);`
- Optionally verify `smallScratch` is left untouched.

### 2. `akvj/test/Clip.test.js` — invalid `frameRatesForFrames` fallback

**File:** `akvj/test/Clip.test.js` (lines 197–210)

**Test:** `falls back to default frame rate when all rates invalid`

**Current:**
```js
expect(() => clip.renderToContext(ctx)).not.toThrow();
```

**Action:**
- `expect(ctx.drawImage).toHaveBeenCalled();`
- `expect(clip.currentFrame).toBeGreaterThan(0);` (or exact frame index for default 12 FPS over 1000ms).

### 3. `akvj/test/Clip.test.js` — `frameRatesForFrames: null`

**File:** `akvj/test/Clip.test.js` (lines 212–225)

**Test:** `handles frameRatesForFrames: null without throwing`

**Current:**
```js
expect(clip).toBeInstanceOf(Clip);
expect(() => clip.renderToContext(ctx)).not.toThrow();
```

**Action:**
- `expect(ctx.drawImage).toHaveBeenCalled();`
- Verify `clip.currentFrame` advances or remains as expected for default frame rate.

## Affected files

- `akvj/test/effects.test.js`
- `akvj/test/Clip.test.js`

## Verification

- `npm run lint` passes.
- `npm run test -w akvj` passes.
- `npm run build -w akvj` passes.

## Notes

- Unit tier only. No source changes intended.
