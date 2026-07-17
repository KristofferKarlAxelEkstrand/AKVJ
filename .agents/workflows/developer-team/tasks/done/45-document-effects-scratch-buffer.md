# Task 45: Document EffectsPipeline Scratch Buffer Contract

## Severity: Low (Performance/Architecture)

## Location
`akvj/src/js/visuals/effects/EffectsPipeline.js:61-64` and `akvj/src/js/visuals/effects/glitchEffect.js:19`

## Problem
`EffectsPipeline` allocates and caches a `#scratchBuffer` and passes it via `effectContext.scratchBuffer`. However, `glitchEffect.js` has its own fallback allocation, and `pixelUtils.js` `transformCopy` also has a fallback. Buffer ownership is unclear, and sharing the same buffer across multiple effects in the same frame is safe for current effects but fragile.

## Fix
1. Document the scratch buffer contract clearly: "scratchBuffer is temporary space valid only during a single `apply()` call. Do not retain references."
2. Remove redundant fallback allocations in `glitchEffect.js` and `pixelUtils.js` if the pipeline guarantees proper sizing
3. Consider giving each effect its own scratch buffer if sharing becomes problematic

## Verification
- Run `npm run test -w akvj` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `akvj/src/js/visuals/effects/EffectsPipeline.js` — pipeline that owns scratch buffer
- `akvj/src/js/visuals/effects/glitchEffect.js` — effect with fallback allocation
- `akvj/src/js/visuals/effects/pixelUtils.js` — utility with fallback allocation

## Constraints
- Do NOT break existing effects behavior
- Document the contract clearly in JSDoc comments

## Dependencies
- None (discovered during Task 37a code review)
