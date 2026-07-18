---
status: done
assignee: akvj-developer
priority: medium
---

# Task 183: Strengthen splitEffect Tests — Verify Pixel Modification

## Source
`.agents/workflows/developer-team/inbox/[TEST]-flake-split-effect-vacuous.md`
(Test Marshal — flake risk, vacuous assertions).

## Problem
`akvj/test/effects.test.js` lines 217-255 — both `splitEffect` tests only assert `result === true` without verifying pixels were modified. `splitEffect.apply()` unconditionally returns `true`, so these tests pass even if the effect is a no-op.

### Horizontal split test (line 217)
- Sets up sequential pixel values but never checks they changed after split
- Comment admits: "Just verify it runs and returns true"

### Vertical split test (line 238)
- Same pattern

## Fix
After calling `splitEffect.apply`, verify pixel values changed from originals. Example for horizontal split with `splits=2` on 4×2 image:
- `sectionWidth=2`, so pixel(0,0) stays from pixel(0,0) (unchanged)
- pixel(2,0) should come from pixel(0,0) (changed from 2 to 0)

Follow the pattern from `mirrorEffect`/`offsetEffect`/`colorEffect` tests which verify specific pixel values.

## Verification
- `npm run test -w akvj -- test/effects.test.js`
- `npm run lint`

## Files
- `akvj/test/effects.test.js`
