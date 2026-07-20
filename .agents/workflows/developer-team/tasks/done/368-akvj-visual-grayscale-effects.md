---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Task 368: Visual suite — grayscaleDisplacement + grayscaleBlend screenshots

## Source

Test Marshal `[TEST]-akvj-visual-grayscale-effects.md`

## Description

Unit coverage for `grayscaleBlendEffect.js` / `grayscaleDisplacementEffect.js` is strong. The Chromium visual tier still only screenshots the original six effects. Add visual references for the two grayscale effects. Test-only — no product source changes.

## Checklist

- [ ] `akvj/test/visual/canvas.test.js` — `grayscaleDisplacement` screenshot via `createEffect(..., settings.effectRanges.grayscaleDisplacement.min, 127)` on mixed/global effects path; use luminance-varying clip source
- [ ] `akvj/test/visual/canvas.test.js` — `grayscaleBlend` screenshot similarly with `grayscaleBlend` range
- [ ] Optional: variant B each at `range.min + settings.effectParams.effectVariantThreshold` (threshold `8`)
- [ ] `akvj/test/visual/helpers/visualTestHelpers.js` — extend `createEffect` JSDoc types with `'grayscaleDisplacement' | 'grayscaleBlend'`
- [ ] Commit new refs under `akvj/test/visual/__screenshots__/` after `npm run test:visual:update` (human commits binaries)

## Verification

- `npm run test:visual` passes with new references
- `npm run lint -w akvj` passes
