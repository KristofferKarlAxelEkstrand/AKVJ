---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 178: Test Coverage for mainframe/scripts/clips — spritesheet, optimize, copy

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-scripts-clips-coverage.md`
(Test Marshal — coverage gaps in clip build scripts).

## Scope

### 1. spritesheet.js — zero coverage (HIGH, 158 lines)
**File:** `mainframe/scripts/clips/spritesheet.js`

Cases to add:
- `loadFrameFiles` filters to png/jpg/jpeg and sorts by embedded number
- `writeMetaFile` produces correct meta.json structure
- `parseArgs` parses CLI args correctly
- `createSpriteSheet` end-to-end with fixture images

### 2. lib/optimize.js — only getTargetBitDepth tested (MEDIUM, 241 lines)
**File:** `mainframe/scripts/clips/lib/optimize.js`

Cases to add:
- `optimize` with no sharp copies files and reports `sharp: false`
- `optimizeFile` skips when cache is valid
- `finalizeOptimizedFile` keeps optimized when smaller, falls back when larger (no bitDepth)
- `finalizeOptimizedFile` always keeps bitDepth-converted output regardless of size
- `handleOptimizeError` cleans up temp file and attempts copy fallback
- `copyClipJsonFiles` copies only .json files

### 3. lib/copy.js — only indirect coverage (MEDIUM, 141 lines)
**File:** `mainframe/scripts/clips/lib/copy.js`

Cases to add:
- `copyToPublic` copies changed files, skips matching files, removes orphans
- `copyToPublic` preserves LICENSE files in public dir
- `removeEmptyDirs` removes nested empty directories
- `clean` removes cache and public generated files but preserves LICENSE

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/spritesheet.test.js` (new)
- `mainframe/test/optimize.test.js` (new or extend `optimize-bitDepth.test.js`)
- `mainframe/test/copy.test.js` (new)
- `mainframe/scripts/clips/spritesheet.js` (reference)
- `mainframe/scripts/clips/lib/optimize.js` (reference)
- `mainframe/scripts/clips/lib/copy.js` (reference)
