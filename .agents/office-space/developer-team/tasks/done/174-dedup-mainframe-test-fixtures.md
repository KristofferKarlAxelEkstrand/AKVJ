---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 174: Deduplicate mainframe Test Fixtures — mockHttp, PNG_1x1, writeClip

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-test-fixture-duplication.md`
(Test Marshal Sweep 7 — fixture duplication, 3 items).

## Scope

### 1. Mock HTTP response factory (MEDIUM)
Extract shared `createMockResponse()` to `mainframe/test/utils/mockHttp.js`.
- Base on `httpUtils.test.js` version (more complete — has `setHeader()`, uses `vi.fn()`)
- Update `pipeline-endpoint.test.js` and `httpUtils.test.js` to import from shared module

### 2. 1x1 PNG base64 constant (MEDIUM)
Extract `PNG_1x1` to `mainframe/test/utils/pngFixtures.js` as a shared Buffer export.
- Standardize on one base64 encoding
- Update 5 files: `Pipeline.full.test.js`, `Pipeline.test.js`, `migrateClipsToProjects.test.js`, `spritesheet.test.js`, `frameLoad.test.js`
- Leave `server.test.js` `PNG_4x4` as-is (intentionally different size)

### 3. writeClip / createTestClip helper (LOW)
Extract shared `writeClip(dir, clipId, { meta, hasPng, pngBuffer })` to `mainframe/test/utils/clipFixtures.js`.
- Default `meta` to `{ png: 'sprite.png', frames: 1, framesPerRow: 1 }`
- Default `pngBuffer` to shared `PNG_1x1`
- Update 3 files: `Pipeline.full.test.js`, `migrateClipsToProjects.test.js`, `validate-extended.test.js`

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/utils/mockHttp.js` (new)
- `mainframe/test/utils/pngFixtures.js` (new)
- `mainframe/test/utils/clipFixtures.js` (new)
- `mainframe/test/pipeline-endpoint.test.js` (update import)
- `mainframe/test/httpUtils.test.js` (update import)
- `mainframe/test/Pipeline.full.test.js` (update imports)
- `mainframe/test/Pipeline.test.js` (update import)
- `mainframe/test/migrateClipsToProjects.test.js` (update imports)
- `mainframe/test/spritesheet.test.js` (update import)
- `mainframe/test/frameLoad.test.js` (update import)
- `mainframe/test/validate-extended.test.js` (update import)
