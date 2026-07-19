# [NIT] Visuals/TimingConversion Semantic Sweep — 2026-07-19

## Area Swept
`akvj/src/js/visuals/` (focused on new file `timingConversion.js` and re-check of core timing files: `ClipTiming.js`, `Clip.js`, `ClipLoader.js`, `PlaybackController.js`)

## Findings

### 1. ClipTiming.js error message prefix mismatch
**File:** `akvj/src/js/visuals/ClipTiming.js`  
**Lines:** 242, 250, 260, 266  
**Issue:** Error messages use `"Clip:"` prefix but are logged from `ClipTiming` class, not `Clip` class. This is misleading when debugging.  
**Current:** `console.warn(\`Clip: frame duration key ${frameIndex} is not a valid frame index; skipping\`);`  
**Proposed:** `console.warn(\`ClipTiming: frame duration key ${frameIndex} is not a valid frame index; skipping\`);`  
**Rationale:** Error messages should accurately identify their source class for easier debugging.

## Celebrations
- **timingConversion.js**: Beautifully clean new module. Celebrated clear function names (`msToFps`, `fpsToMs`, `durationsMsToFrameRates`, `frameRatesToDurationsMs`), honest unit naming (`durationMs`, `fps`), proper JSDoc with `@throws`, well-documented constant (`MS_PER_SECOND`), and clear separation of concerns. The bidirectional conversion pattern is elegant and the module comment explains the backward compatibility context perfectly.
- **Clip.js**: Clean delegation pattern with clear separation between timing (ClipTiming) and playback (PlaybackController). Celebrated descriptive private field names (`#numberOfFrames`, `#shouldRetrigger`, `#lastRenderTimestamp`), honest parameter naming in constructor, and proper JSDoc coverage.
- **ClipLoader.js**: Excellent security hardening with comprehensive validation. Celebrated descriptive method names (`#sanitizeFileName`, `#validateMappingEntry`, `#buildMappingResult`), clear separation of concerns across validation/loading/building phases, and proper error handling with context.
- **PlaybackController.js**: Clean playback mode logic with clear state management. Celebrated descriptive private field names (`#pingpongDirection`, `#lastShuffleFrame`, `#unplayedShuffleFrames`), clear method names (`#drawNextShuffleFrame`, `#buildShuffledFramePool`), and comprehensive JSDoc explaining the progress → frame mapping contract.

## Next Sweep Area
Rotate to `akvj/src/js/visuals/LayerManager.js` + `LayerGroup.js` + `MaskManager.js` (layer coordination logic) or any brand-new stable files that appear.
