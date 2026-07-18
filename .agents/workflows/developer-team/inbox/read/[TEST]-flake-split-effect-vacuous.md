# [TEST] Flake Risk: splitEffect tests assert only return value, not pixel modification

## Priority
Medium

## Filed by
Test Marshal

## Date
2026-07-18

## Location
`akvj/test/effects.test.js` lines 217-255

## Problem
Both `splitEffect` tests ("horizontal split creates repeating sections" and "vertical split creates repeating sections") only assert `result === true` without verifying that any pixels were actually modified by the effect.

The source code at `akvj/src/js/visuals/effects/splitEffect.js:33` unconditionally returns `true` — the return value is not conditional on any actual pixel modification occurring. The tests set up unique sequential pixel values (0-7 in R channel) but never check that those values changed after the split operation.

The test comment at line 235 even admits: "Just verify it runs and returns true; exact pixel values depend on split count."

### Why this is a flake risk
- If `transformCopy` silently did nothing (e.g., scratch buffer allocation failed, swap function returned wrong indices), the tests would still pass
- If `applyHorizontalSplit` or `applyVerticalSplit` were refactored to a no-op, the tests would still pass
- The tests provide no verification that the split effect actually creates repeating sections

### Contrast with other effect tests
- `mirrorEffect` tests verify specific pixel values after transformation (e.g., `img.data[(0 * WIDTH + 3) * 4]).toBe(0)`)
- `offsetEffect` tests verify specific pixel values after transformation (e.g., `img.data[0]).toBe(1)`)
- `colorEffect` tests verify specific pixel values after transformation (e.g., `img.data[0]).toBe(MAX_COLOR_VALUE - 100)`)

## Recommendation
After calling `splitEffect.apply`, verify that at least some pixel values changed from their original sequential values. For example:
1. Capture original pixel values before apply
2. After apply, verify at least some pixels differ from originals
3. For horizontal split with `splits=2` on a 4×2 image: sectionWidth=2, so pixel(0,0) should come from pixel(0,0) (unchanged), but pixel(2,0) should come from pixel(0,0) (changed from 2 to 0)

## Source references
- `akvj/src/js/visuals/effects/splitEffect.js:21-33` — `apply()` always returns `true`
- `akvj/src/js/visuals/effects/splitEffect.js:41-47` — `applyHorizontalSplit` uses `transformCopy`
- `akvj/test/effects.test.js:217-236` — horizontal split test
- `akvj/test/effects.test.js:238-255` — vertical split test
