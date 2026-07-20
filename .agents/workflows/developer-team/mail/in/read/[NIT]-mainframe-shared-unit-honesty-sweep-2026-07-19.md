# [NIT] Mainframe shared helpers unit-honesty sweep

Area: `mainframe/shared/` (`frameTiming.js`, `clipSchema.js`, `frameFit.js`, `frameBake.js`, `mappingLeaf.js`, `clipId.js`, `index.js`)

`mainframe/shared/` is otherwise excellent — focused, well-named helpers (`msToFps`, `fpsToMs`, `durationsMsToFrameRates`, `resolvePlacement`, `resolveScaleMode`, `resolveFrameBakeConfig`, `parseMappingLeaf`, `serializeMappingLeaf`), clear constants (`DEFAULT_FRAME_WIDTH`, `VALID_BIT_DEPTHS`, `MAPPING_OVERRIDE_KEYS`), and a clean barrel export. Two small unit-honesty items surfaced in `frameTiming.js`.

## Findings

### 1. `frameTiming.js` bare `1000` used for milliseconds-per-second conversion
- **File**: `mainframe/shared/frameTiming.js` (lines 19, 27, 29, 33)
- **Current**:
  - `return 1000 / ms;`
  - `const fallbackMs = 1000 / DEFAULT_FALLBACK_FPS;`
  - `const fallback = Number.isFinite(fallbackMs) && fallbackMs > 0 ? fallbackMs : 1000 / DEFAULT_FALLBACK_FPS;`
  - `return 1000 / rate;`
- **Proposed**:
  - Add `const MS_PER_SECOND = 1000;` near the top of the file (after the JSDoc header).
  - Replace all four bare `1000` uses with `MS_PER_SECOND`.
- **Rationale**: `1000` is the canonical milliseconds-per-second constant. Naming it matches the recent unit-honesty cleanup in `akvj/src/js/core/` (`MS_PER_SECOND`) and makes the FPS↔ms conversion intent obvious.

### 2. `frameTiming.js` JSDoc default for `fallbackFps` is stale
- **File**: `mainframe/shared/frameTiming.js` (lines 9 and 39)
- **Current**:
  - `@param {number} [fallbackFps=12]`
  - `@param {number} [fallbackFps=12]`
- **Proposed**:
  - `@param {number} [fallbackFps=DEFAULT_FALLBACK_FPS]`
  - `@param {number} [fallbackFps=DEFAULT_FALLBACK_FPS]`
- **Rationale**: The actual default parameter value is `DEFAULT_FALLBACK_FPS` (currently `12`). The JSDoc should reference the named constant so it stays in sync if the default ever changes.

## Celebrations

- `clipSchema.js` is a beautiful single source of truth: constants are well-named, `Object.freeze` is used correctly, and `resolvePlacement` is a focused helper.
- `frameFit.js` `computeFrameDrawRect` is admirably clear, with honest parameter names (`sourceWidth`, `targetWidth`) and a readable `stretch`/`fit`/`cover`/`none` branch.
- `mappingLeaf.js` `parseMappingLeaf` / `parseFlatMappingEntry` have excellent result-shape naming (`ok`, `clipId`, `overrides`, `error`).
