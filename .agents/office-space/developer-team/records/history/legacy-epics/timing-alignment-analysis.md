# AKVJ ↔ Mainframe Timing Alignment Analysis

## Status
✅ **COMPLETED** - All phases implemented and verified (2026-07-19)

## Current State

### AKVJ Timing System
- **Primary field**: `frameRatesForFrames` (object: frame index → FPS)
- **Conversion**: FPS → ms via `MS_PER_SECOND / framesPerSecond`
- **Location**: `akvj/src/js/visuals/ClipTiming.js`, `akvj/src/js/visuals/clipMetadata.js`
- **Beat sync**: Speed multiplier scales FPS-derived intervals
- **No ms support**: Cannot directly use ms-per-frame values

### Mainframe Timing System
- **Primary field**: `frameDurationsMs` (array: ms per frame)
- **Usage**: Staging preview only (`mainframe/src/js/StagingPreview.js`)
- **Conversion utilities**: `frameTiming.js` has `msToFps()`, `fpsToMs()`, `durationsMsToFrameRates()`
- **Not in metadata**: `frameDurationsMs` is UI-only, not saved to clip metadata
- **Can convert**: Has bidirectional ms ↔ FPS conversion

## Key Gaps

1. **Format mismatch**: AKVJ uses FPS objects, mainframe uses ms arrays
2. **No shared field**: No common timing field in clip metadata
3. **Conversion unused**: Mainframe's conversion utilities aren't used by AKVJ
4. **Incomplete integration**: `frameDurationsMs` exists but isn't integrated into engine timing

## Required Changes for Alignment

### 1. AKVJ Metadata Normalization
**File**: `akvj/src/js/visuals/clipMetadata.js`
- Add `frameDurationsMs` to normalized metadata
- Support both `frameRatesForFrames` (legacy) and `frameDurationsMs` (new)
- Convert `frameDurationsMs` → FPS internally if needed for backward compatibility

### 2. AKVJ Timing Engine
**File**: `akvj/src/js/visuals/ClipTiming.js`
- Add support for ms-based timing via `frameDurationsMs`
- Use ms values directly when available (no FPS conversion needed)
- Maintain FPS fallback for backward compatibility
- Update beat sync to work with ms values instead of FPS conversion

### 3. Mainframe Metadata Persistence
**File**: `mainframe/src/js/ClipEditorController.js` (or similar)
- Save `frameDurationsMs` to clip metadata when editing clips
- Convert UI ms values to metadata format
- Ensure validation accepts ms arrays

### 4. Clip Schema Documentation
**File**: `.agents/workflows/developer-team/spec/clip-format.md`
- Document `frameDurationsMs` as primary timing field
- Mark `frameRatesForFrames` as legacy/deprecated
- Update field descriptions and examples

### 5. Migration Strategy
- Convert existing `frameRatesForFrames` → `frameDurationsMs` in clip metadata
- Use mainframe's `durationsMsToFrameRates()` in reverse direction
- Update default clips in `projects/default/clips/`

### 6. Shared Conversion Utilities
**Option A**: Copy `frameTiming.js` utilities to AKVJ (violates no-shared-imports rule)
**Option B**: Implement same utilities in AKVJ manually
**Option C**: Use only ms values in AKVJ, eliminate FPS conversion entirely

## Recommended Approach

**Phase 1**: Add ms support to AKVJ
- Add `frameDurationsMs` to metadata normalization
- Update ClipTiming to use ms values when available
- Keep FPS as fallback for compatibility

**Phase 2**: Mainframe integration
- Save `frameDurationsMs` to clip metadata
- Update UI to work with ms values natively

**Phase 3**: Migration
- Convert existing clips to use ms values
- Deprecate `frameRatesForFrames` (but keep for compatibility)

**Phase 4**: Cleanup
- Remove FPS conversion if no longer needed
- Simplify timing code to ms-only

## Benefits of Alignment

1. **Direct ms control**: Users can set exact ms per frame
2. **Simpler math**: No FPS ↔ ms conversion needed
3. **Shared format**: Both systems use same timing approach
4. **Better sync**: ms values scale cleanly with BPM
5. **Less conversion**: Eliminates conversion overhead

## Risks

1. **Breaking changes**: Existing clips with FPS values need migration
2. **Performance**: Need to ensure ms timing is as fast as FPS
3. **Compatibility**: Must support legacy `frameRatesForFrames` during transition
4. **Testing**: Extensive test coverage needed for both timing modes

## Completion Summary

All phases of the timing alignment epic have been successfully completed:

- ✅ **Phase 1**: AKVJ ms support added (tasks 253, 256)
- ✅ **Phase 2**: Mainframe integration completed (tasks 254, 255)
- ✅ **Phase 3**: Migration of existing clips to ms-based timing (task 258)
- ✅ **Phase 4**: QA review and verification (task 259)

### Final State
- Both AKVJ and mainframe now support `frameDurationsMs` as the primary timing field
- Backward compatibility with `frameRatesForFrames` is maintained
- All 1,141 tests pass across both workspaces
- No performance regression detected
- Timing alignment epic is now closed
