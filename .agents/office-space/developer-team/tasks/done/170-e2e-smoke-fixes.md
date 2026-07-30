---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 170: Fix Stale e2e Selectors, Flaky Patterns, Orphan Test, and Duplication (Test Marshal Sweep 4)

## Source
`.agents/workflows/developer-team/inbox/[TEST]-e2e-smoke-coverage.md`
(Test Marshal — e2e, smoke, and test organization issues).

## Scope

### 1. e2e/mainframe.spec.js — stale selectors (HIGH PRIORITY)
The spec references old inline upload form DOM. Update all selectors:
- `data-tab="upload"` → `data-tab="editor"`
- `#panel-upload` → `#panel-clip-editor`
- `#upload-clip-id` → `#clip-editor-clip-id`
- `#upload-target-width` → `#clip-editor-target-width`
- `#upload-target-height` → `#clip-editor-target-height`
- `#upload-playback` → `#clip-editor-playback`
- `#upload-frame-rate` → `#clip-frames-fps-preset`
- `.clip-edit` button → ClipList `clipedit` events
- `.clip-edit-form` → `#clip-editor-form`
- `input[name="frames"]`, `input[name="framesPerRow"]` → remove (don't exist)
- `select[name="playback"]` → `#clip-editor-playback`
- `button:has-text("Save metadata")` → `#clip-editor-submit` with "Create sprite & save"
- Verify "AKVJ Mainframe" h1 text

### 2. e2e/mainframe.spec.js — vacuous `if (count > 0)` blocks
3 tests pass vacuously when no data exists. Fix with `test.skip`/`test.fixme` or seed data.

### 3. e2e/akvj.spec.js — hardcoded URLs and `waitForTimeout` sleeps
- Replace hardcoded `http://127.0.0.1:8888/` with per-test baseURL or explicit config
- Replace `waitForTimeout(1000)` with polling for canvas alpha or event-based waits

### 4. e2e/mainframe.spec.js — `waitForTimeout(1000)` sleep
Replace with waiting for app-ready event or DOM state.

### 5. mainframe/server/health.test.js — orphan test
- Move test cases to `mainframe/test/paths.test.js` (verify no coverage loss)
- Delete `mainframe/server/health.test.js`

### 6. Duplication: `pollUrl` across 3 smoke files
Extract to shared utility, import in all three.

### 7. Duplication: `createMockClip` across 2 test files
Extract to `akvj/test/utils/createMockClip.js`, import in both.

### 8. Smoke `.test.js` suffix on standalone scripts
Rename to `.smoke.js` or move to `scripts/` directory.

## Verification
- `npm run test` (both workspaces)
- `npm run lint`
- `npx playwright test` (if e2e environment available)

## Files
- `e2e/mainframe.spec.js`
- `e2e/akvj.spec.js`
- `mainframe/server/health.test.js`
- `mainframe/test/paths.test.js`
- `akvj/test/smoke/akvj-startup.test.js`
- `mainframe/test/smoke/startup.test.js`
- `mainframe/test/smoke/mainframe-startup.test.js`
- `akvj/test/LayerGroup.test.js`
- `akvj/test/integration.test.js`
