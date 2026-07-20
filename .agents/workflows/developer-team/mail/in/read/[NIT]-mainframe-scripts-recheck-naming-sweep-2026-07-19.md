# [NIT] Mainframe scripts re-check: magic numbers and vague result naming

Area: `mainframe/scripts/` (`Pipeline.js`, `index.js`, `spritesheet.js`, `optimize.js`, `validateMapping.js`, `lib/*`)

Prior nits from `[NIT]-mainframe-scripts-dry-violation-2026-07-19.md` look resolved: `optimize.js` now imports `VALID_BIT_DEPTHS` from `shared/clipSchema.js` instead of defining a local Set. The rest of the pipeline remains clean and well-structured. A fresh pass surfaced four small naming/magic-value nits.

## Findings

### 1. `scripts/clips/lib/validateMapping.js` vague `data` property on `loadKeyMap` result
- **File**: `mainframe/scripts/clips/lib/validateMapping.js` (lines 20, 42)
- **Current**:
  - `return { data: keyMap };`
  - `return { errors: collectNestedKeyMapErrors(keyMap.data, validIds) };`
- **Proposed**:
  - `return { keyMap };`
  - In `validateKeyMap`: `const keyMapResult = await loadKeyMap(...);` then `return { errors: collectNestedKeyMapErrors(keyMapResult.keyMap, validIds) };`
- **Rationale**: `data` is explicitly listed as a vague term to avoid in `code-standards.md` / `AGENTS.md`. The value being returned is a parsed `key-map.json` object, so `keyMap` is the honest domain name.

### 2. `scripts/clips/spritesheet.js` hard-codes default frame rate instead of using imported constant
- **File**: `mainframe/scripts/clips/spritesheet.js` (line 33)
- **Current**: `frameRate: 12`
- **Proposed**: `frameRate: DEFAULT_FRAME_RATE`
- **Rationale**: `DEFAULT_FRAME_RATE` is already imported from `./lib/spritesheet-core.js` (line 22). Using it keeps the CLI default in sync with the canonical runtime default and removes a magic number.

### 3. `scripts/clips/index.js` bare `1000` for milliseconds-to-seconds conversion
- **File**: `mainframe/scripts/clips/index.js` (line 94)
- **Current**: `const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);`
- **Proposed**:
  - Add `const MS_PER_SECOND = 1000;` near the other path constants (around line 27–34).
  - Use `const elapsed = ((performance.now() - startTime) / MS_PER_SECOND).toFixed(2);`
- **Rationale**: Matches the recent unit-honesty cleanup in `akvj/src/js/core/` (`#shouldProcessClockPulse` bare `1000` → `MS_PER_SECOND`). `1000` is the canonical milliseconds-per-second constant and should be named.

### 4. `scripts/clips/lib/optimize.js` bare `128` grayscale threshold for 1-bit conversion
- **File**: `mainframe/scripts/clips/lib/optimize.js` (line 76)
- **Current**: `return pipeline.grayscale().threshold(128).png(BIT_DEPTH_PNG_OPTIONS[1]);`
- **Proposed**:
  - Add `const DEFAULT_1BIT_THRESHOLD = 128;` near `STANDARD_PNG_OPTIONS` (around line 72).
  - Use `return pipeline.grayscale().threshold(DEFAULT_1BIT_THRESHOLD).png(BIT_DEPTH_PNG_OPTIONS[1]);`
- **Rationale**: `128` is the midpoint grayscale threshold for converting to 1-bit, but the bare number gives no hint why this value was chosen. A named constant makes the 1-bit pipeline self-documenting.

## Celebrations

- `Pipeline.js` still has excellent phase separation (`#validate`, `#optimize`, `#generate`, `#copy`, `#copyProjectIndexFiles`) and clear helper names (`collectFilesFromEntries`, `copyChangedFiles`, `removeOrphanedFiles`, `processClipOptimization`).
- `optimize.js` is much cleaner now that `VALID_BIT_DEPTHS` is shared, and `getTargetBitDepth` / `applyBitDepthPipeline` are focused and readable.
- `new.js` is a tidy scaffolding tool with clear template defaults and good error messages.
