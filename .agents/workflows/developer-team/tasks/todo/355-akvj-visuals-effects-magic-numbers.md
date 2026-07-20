---
status: backlog
assignee: none
priority: medium
review: machine
---

# Task 355: AKVJ visuals effects magic-number naming

## Source

Nitpicker `[NIT]-akvj-visuals-effects-magic-numbers-2026-07-20.md`

## Description

Name the remaining bare numeric literals in the grayscale/color effects so they read as clearly as `strobeEffect.js`.

## Checklist

- [ ] `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`: add `MID_GRAY_LUMINANCE = 128` and replace the four bare `128` literals in `#applyHorizontalDisplacement` and `#applyVerticalDisplacement`.
- [ ] `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`: add `CHROMATIC_ABERRATION_SHIFT_PIXELS = 4` and use it in the `shiftAmount` calculation.
- [ ] `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`: add `GRAYSCALE_BLEND_BIT_DEPTH_PARAMS = { 2: { divisor: 64, maxLevel: 3 }, 4: { divisor: 16, maxLevel: 15 }, 8: { divisor: 1, maxLevel: 255 } }` and replace the scattered literals in `getBitDepthParams`.
- [ ] `akvj/src/js/visuals/effects/colorEffect.js`: add `MIN_POSTERIZE_LEVELS = 2` and use it in the `Math.max` clamp.
- [ ] `akvj/src/js/visuals/effects/splitEffect.js`: add `NOTES_PER_SPLIT_SECTION = 2` and use it in the section calculation.

## Affected files

- `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`
- `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`
- `akvj/src/js/visuals/effects/colorEffect.js`
- `akvj/src/js/visuals/effects/splitEffect.js`

## Verification

- `npm run lint -w akvj` passes
- `npm run test -w akvj` passes
- `npm run build -w akvj` passes
