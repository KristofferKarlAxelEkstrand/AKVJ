---
type: nit
from: nitpicker
created: 2026-07-20T12:57:30+00:00
---

# [NIT] `akvj/src/js/visuals/effects/` — magic numbers in the new grayscale/color effects

The new/modified pixel-effect files are nicely shaped, but a handful of bare numeric literals make readers pause to recall what they represent. Naming them would let the effects read as clearly as `strobeEffect.js` already does.

## Checklist

### 1. `grayscaleDisplacementEffect.js` — `128` is mid-gray

- **File:** `akvj/src/js/visuals/effects/grayscaleDisplacementEffect.js`
- **Current:** bare `128` in `#applyHorizontalDisplacement` (line 67) and `#applyVerticalDisplacement` (line 104)
- **Proposed:** `const MID_GRAY_LUMINANCE = 128;` and replace all four `128` literals in both functions
- **Rationale:** `128` is the 50% gray neutral point that drives displacement direction and magnitude; naming it removes four identical literals and centralizes the convention.

### 2. `grayscaleBlendEffect.js` — `4` is the chromatic aberration shift distance

- **File:** `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`
- **Current:** `const shiftAmount = Math.floor(intensity * 4);` (line 78)
- **Proposed:** `const CHROMATIC_ABERRATION_SHIFT_PIXELS = 4;` then `const shiftAmount = Math.floor(intensity * CHROMATIC_ABERRATION_SHIFT_PIXELS);`
- **Rationale:** `4` is the maximum pixel distance the red/blue channels are shifted for the lo-fi chromatic aberration; naming it makes the intensity scaling obvious.

### 3. `grayscaleBlendEffect.js` — `getBitDepthParams` uses bare divisor/maxLevel literals

- **File:** `akvj/src/js/visuals/effects/grayscaleBlendEffect.js`
- **Current:** `return { divisor: 64, maxLevel: 3 };`, `{ divisor: 16, maxLevel: 15 };`, `{ divisor: 1, maxLevel: 255 };` in `getBitDepthParams` (lines 131-137)
- **Proposed:** replace with a named lookup constant, e.g. `const GRAYSCALE_BLEND_BIT_DEPTH_PARAMS = { 2: { divisor: 64, maxLevel: 3 }, 4: { divisor: 16, maxLevel: 15 }, 8: { divisor: 1, maxLevel: 255 } };` and return `GRAYSCALE_BLEND_BIT_DEPTH_PARAMS[bitDepth]`
- **Rationale:** the mapping from bit depth to quantization parameters is buried in six scattered literals; a named table makes the relationship explicit and matches the repo's constant-first style.

### 4. `colorEffect.js` — `2` is the minimum posterize band count

- **File:** `akvj/src/js/visuals/effects/colorEffect.js`
- **Current:** `Math.max(2, Math.floor(posterizeBaseLevels - intensity * posterizeIntensityScale))` (line 42)
- **Proposed:** `const MIN_POSTERIZE_LEVELS = 2;` and `Math.max(MIN_POSTERIZE_LEVELS, ...)`
- **Rationale:** `2` is the minimum number of color bands for posterization; naming the clamp clarifies why the lower bound exists.

### 5. `splitEffect.js` — `2` is the note-to-split-section interval

- **File:** `akvj/src/js/visuals/effects/splitEffect.js`
- **Current:** `Math.floor(noteInRange / 2)` (line 26)
- **Proposed:** `const NOTES_PER_SPLIT_SECTION = 2;` and `Math.floor(noteInRange / NOTES_PER_SPLIT_SECTION)`
- **Rationale:** the split count increases by one for every two notes in the effect range; naming the interval makes the note-to-section mapping readable.

---

**Area swept:** `akvj/src/js/visuals/effects/` (13 files)
**New/updated files in scope:** `grayscaleDisplacementEffect.js`, `grayscaleBlendEffect.js`, `colorEffect.js`, `splitEffect.js`
**Celebration:** `strobeEffect.js` is a joy to read — every numeric value already has a named constant. That same polish on the grayscale/color effects would be a lovely gift to future readers.
**No out-of-lane findings this sweep.**
