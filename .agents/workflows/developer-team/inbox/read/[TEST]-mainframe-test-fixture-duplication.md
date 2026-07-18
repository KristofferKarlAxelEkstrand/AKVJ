# [TEST] mainframe/test/ — fixture duplication: mock HTTP response, 1x1 PNG, writeClip helper

**From:** Test Marshal  
**Area:** `mainframe/test/` (sweep 7)  
**Date:** 2026-07-18  
**Tier:** unit / integration  
**Special mission:** Fixture diet — find duplicated test setup ripe for a shared helper

## Summary

Cross-cutting audit of `mainframe/test/` found three fixture duplication patterns ripe
for shared helpers. Previously filed gaps from [TEST]-mainframe-editor-coverage.md and
[TEST]-mainframe-server-pipeline-coverage.md are all **confirmed resolved** (see below).

## Checklist

### 1. Mock HTTP response factory — duplicated in 2 files (medium priority)

**Files:**
- `mainframe/test/pipeline-endpoint.test.js` (lines 30–44): `mockRes()`
- `mainframe/test/httpUtils.test.js` (lines 19–35): `createMockResponse()`

Both create an object with `statusCode`, `headers`, `body`, `writeHead()`, `end()`.
The `httpUtils.test.js` version also has `setHeader()` and uses `vi.fn()` for spies;
the `pipeline-endpoint.test.js` version uses plain methods.

Fix:
- [ ] Extract a shared `createMockResponse()` to `mainframe/test/utils/mockHttp.js`
      (use the `httpUtils.test.js` version as the base — it's more complete)
- [ ] Update `pipeline-endpoint.test.js` to import from shared module
- [ ] Update `httpUtils.test.js` to import from shared module

### 2. 1x1 PNG base64 constant — duplicated across 6 files (medium priority)

**Files (all contain the same or equivalent 1x1 PNG base64):**
- `mainframe/test/Pipeline.full.test.js` (line 7): `PNG_1x1` — base64 `iVBORw0KGgo...FADsZg8...`
- `mainframe/test/Pipeline.test.js` (line 12): inline `pngBase64` — same base64
- `mainframe/test/migrateClipsToProjects.test.js` (line 8): `PNG_1x1` — different base64 `iVBORw0KGgo...AhKmMIQ...` (also valid 1x1 PNG)
- `mainframe/test/server.test.js` (line 6): `PNG_4x4` — 4x4 PNG (different size, not a dup)
- `mainframe/test/spritesheet.test.js`: 2 occurrences
- `mainframe/test/frameLoad.test.js`: 1 occurrence

Fix:
- [ ] Extract `PNG_1x1` to `mainframe/test/utils/pngFixtures.js` as a shared Buffer export
- [ ] Standardize on one base64 encoding (pick either — both are valid 1x1 transparent PNGs)
- [ ] Update all 5 files to import from shared module
- [ ] Note: `server.test.js` uses `PNG_4x4` (4x4 pixel) — this is intentionally different,
      leave it in place or also extract if desired

### 3. `writeClip` / `createTestClip` helper — duplicated in 3 files (low priority)

**Files:**
- `mainframe/test/Pipeline.full.test.js` (lines 9–14): `writeClip(dir, clipId, meta)`
- `mainframe/test/migrateClipsToProjects.test.js` (lines 15–20): `writeClip(clipId, root)`
- `mainframe/test/validate-extended.test.js` (lines 28–31+): `createTestClip(clipId, meta, hasPng)`

All three create a clip directory, write `sprite.png` + `meta.json`. Signatures differ
slightly (arg order, `hasPng` flag, PNG source). The `validate-extended.test.js` version
constructs a PNG from raw bytes instead of base64.

Fix:
- [ ] Extract a shared `writeClip(dir, clipId, { meta, hasPng, pngBuffer })` to
      `mainframe/test/utils/clipFixtures.js`
- [ ] Default `meta` to `{ png: 'sprite.png', frames: 1, framesPerRow: 1 }`
- [ ] Default `pngBuffer` to the shared `PNG_1x1` from item 2
- [ ] Update all 3 files to import from shared module

## Previously filed gaps — confirmed resolved

- [x] `ClipEditorController` submit paths — now has `ClipEditorController.test.js` (813 lines)
      covering create POST, frames PUT, meta-only PUT, hydrate, GIF expansion
- [x] `playbackUtils.js` — now has `playbackUtils.test.js` (122 lines) covering
      ShuffleState, PingpongState, advanceFrame
- [x] `apiClient.js` — now has `apiClient.test.js` (68 lines) covering success, error,
      headers, custom header merge
- [x] `httpUtils.js` body limit — now has `httpUtils.test.js` (105 lines) covering
      readBody, sendJson, applyCors
- [x] `POST /api/pipeline` — now has `pipeline-endpoint.test.js` (76 lines) covering
      success and failure with mocked child_process
- [x] `Pipeline.js` full build — now has `Pipeline.full.test.js` (173 lines) covering
      full build, noOptimize, clean, missing sprite, per-project, multi-project, sharp fallback

## Notes for Team Lead

- `mainframe/test/` is in strong shape — 46 test files covering all modules.
- The three duplication items are low-risk refactors that would reduce ~50 lines of
  repeated fixture code across 6+ files.
- No product bugs suspected.
- The `mainframe/test/fixtures/` directory is empty — all tests use `os.tmpdir()` or
  `process.cwd()/test/fixtures/` instead. Not a problem, just noted.
