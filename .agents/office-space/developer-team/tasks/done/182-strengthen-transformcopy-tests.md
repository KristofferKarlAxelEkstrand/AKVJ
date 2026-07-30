---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 182: Strengthen transformCopy Scratch Buffer Tests — Verify Pixel Transformation

## Source
`.agents/workflows/developer-team/inbox/[TEST]-flake-transform-copy-vacuous.md`
(Test Marshal — flake risk, vacuous assertions).

## Problem
`akvj/test/effects.test.js` lines 303-329 — two `transformCopy` tests assert only `not.toThrow()` without verifying pixel transformation occurred. Could pass even if the function silently did nothing.

### 1. "allocates scratch buffer when not provided" (line 303)
- Uses `swapFn` (horizontal mirror) but doesn't check pixel values after call
- **Fix:** Use non-identity transform, assert specific pixel values after transformation (like the good test at line 309)

### 2. "allocates new buffer when scratch is too small" (line 323)
- Uses `identityFn` (no-op!) so can't distinguish "ran correctly" from "did nothing"
- **Fix:** Replace `identityFn` with a non-identity transform (e.g. `swapFn`), assert specific pixel values

## Pattern to follow (from line 309 — the good test):
```js
transformCopy(pixels, WIDTH, HEIGHT, scratch, swapFn);
expect(pixels[0]).toBe(3);  // Verifies actual pixel transformation
```

## Verification
- `npm run test -w akvj -- test/effects.test.js`
- `npm run lint`

## Files
- `akvj/test/effects.test.js`
