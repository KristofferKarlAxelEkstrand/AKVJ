# [TEST] mainframe/scripts/clips — coverage gaps in spritesheet, optimize, copy

**From:** Test Marshal  
**Area:** `mainframe/scripts/clips/`  
**Date:** 2026-07-18  
**Tier:** unit (node)

## Summary

Sweep of `mainframe/scripts/clips/` found one module with zero coverage and two with
only thin/indirect coverage. The pipeline integration tests (`Pipeline.full.test.js`)
exercise some modules end-to-end but don't test edge cases or error paths.

## Findings

### 1. `spritesheet.js` — zero test coverage (158 lines)

Standalone CLI script that combines individual frame images into a sprite sheet.
Not imported by Pipeline or any test file. Contains real logic:

- **`parseArgs()`** — CLI argument parsing (input/output dirs, `--frames-per-row`, `--frame-rate`)
- **`loadFrameFiles()`** — file filtering (png/jpg/jpeg), numeric sort logic
- **`createSpriteSheet()`** — orchestrates frame loading, dimension detection, compositing, meta.json generation
- **`writeMetaFile()`** — generates `meta.json` with `png`, `frames`, `framesPerRow`, `playback`, `retrigger`, `frameRatesForFrames`

**Suggested tests:**
- `loadFrameFiles` filters to png/jpg/jpeg and sorts by embedded number
- `writeMetaFile` produces correct meta.json structure
- `parseArgs` parses CLI args correctly
- `createSpriteSheet` end-to-end with fixture images (tier: unit with sharp)

### 2. `lib/optimize.js` — only `getTargetBitDepth` tested (241 lines)

Only `getTargetBitDepth` (62 lines) has a direct unit test (`optimize-bitDepth.test.js`).
The rest is tested only indirectly via `Pipeline.full.test.js`, and one test mocks
`optimize` entirely. Untested directly:

- **`optimize()`** — main entry point; sharp loading, clip iteration, bitDepthCounts tracking
- **`optimizeFile()`** — cache validation, sharp optimization, hash writing
- **`runSharpOptimization()`** — temp file pipeline, size comparison
- **`finalizeOptimizedFile()`** — keeps optimized if smaller OR if bitDepth conversion; falls back to copy if larger
- **`handleOptimizeError()`** — temp file cleanup, copy fallback, error chaining
- **`copyClipJsonFiles()`** — copies all .json files from clip dir to cache
- **`warnIfSizeIncreased()`** — warns when bitDepth conversion bloats file >1.5x

**Suggested tests:**
- `optimize` with no sharp copies files and reports `sharp: false`
- `optimizeFile` skips when cache is valid
- `finalizeOptimizedFile` keeps optimized when smaller, falls back when larger (no bitDepth)
- `finalizeOptimizedFile` always keeps bitDepth-converted output regardless of size
- `handleOptimizeError` cleans up temp file and attempts copy fallback
- `copyClipJsonFiles` copies only .json files

### 3. `lib/copy.js` — only indirect coverage (141 lines)

Tested only via `Pipeline.full.test.js` end-to-end. Key untested logic:

- **`copyToPublic()`** — changed-file detection via `filesMatch`, orphan removal, empty-dir cleanup
- **`removeOrphanedFiles()`** — preserves LICENSE files, removes files not in cache
- **`removeEmptyDirs()`** — recursive empty directory removal
- **`clean()`** — removes cache dir, cleans public dir but preserves LICENSE files

**Suggested tests:**
- `copyToPublic` copies changed files, skips matching files, removes orphans
- `copyToPublic` preserves LICENSE files in public dir
- `removeEmptyDirs` removes nested empty directories
- `clean` removes cache and public generated files but preserves LICENSE

## Priority

- `spritesheet.js` — **High** (zero coverage, 158 lines, standalone tool with real logic)
- `lib/optimize.js` — **Medium** (indirect coverage exists, but error paths and `finalizeOptimizedFile` logic are important)
- `lib/copy.js` — **Medium** (indirect coverage exists, but orphan removal and LICENSE preservation are untested edge cases)
