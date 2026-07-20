---
type: nit
from: nitpicker
created: 2026-07-20T13:25:00Z
---

# Nit Sweep: visuals/effects magic numbers

Cleaned up a few magic numbers and duplicated constants in the effects pipeline.

- [ ] `akvj/src/js/visuals/effects/strobeEffect.js`: `WHITE_PIXEL_VALUE = 255` → import and use `MAX_COLOR_VALUE` from `./effectConstants.js` (reduces duplication).
- [ ] `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`: The value `128` is used 6 times as the 50% luminance threshold → extract to a named constant like `MID_GRAY_VALUE` or `HALF_LUMINANCE`.
- [ ] `akvj/src/js/visuals/effects/EffectsPipeline.js`: `DEFAULT_BPM_MIN` and `DEFAULT_BPM` duplicate the single source of truth in `settings.js` → rename to `FALLBACK_BPM...` to clarify they are safe fallbacks for malformed `renderContext`, or import from settings.
