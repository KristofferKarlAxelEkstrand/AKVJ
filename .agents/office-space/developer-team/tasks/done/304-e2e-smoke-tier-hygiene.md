---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 304: E2E / smoke tier hygiene sweep

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/[TEST]-e2e-smoke-tier-hygiene.md`

## Description

Clean up three E2E/smoke test issues in `e2e/mainframe.spec.js` so the smoke tier exercises the UI honestly and does not rely on stale attributes or conditional skips.

## Findings and actions

### 1. Stale `value` assertion for global duration

**File:** `e2e/mainframe.spec.js:80`

The test asserted `#clip-frames-global-duration` had attribute `value='1000'` and was disabled, but the controller blanks the current value to `''` and disables it when no frames are staged.

**Action:**
- Updated the editor tab test to assert `toHaveValue('')` and `toBeDisabled()` in the empty state.
- Added a new test that uploads a PNG frame, waits for `#clip-frames clip-frame` to appear, and asserts `toHaveValue('1000')` and `toBeEnabled()`.

### 2. Unreachable `test.skip` in clip edit test

**File:** `e2e/mainframe.spec.js:148-150`

`test.skip(itemCount === 0, ...)` was placed after `toBeVisible()` on `listItems.first()`, so it would never be reached when the library was empty.

**Action:**
- Moved the clip count before the visibility assertion, with a `waitForFunction` guard to let the library populate.
- The skip is now reachable and no longer fails first when the library is empty.

### 3. Conditional skips on mapping seed data

**File:** `e2e/mainframe.spec.js:112` and `e2e/mainframe.spec.js:168`

`test.skip(rowCount === 0, ...)` made mapping assertions and the remove-button test dependent on project seed state.

**Action:**
- Removed the conditional skip from the mapping view test; it now handles either existing rows (asserts cell format) or a true empty state (asserts `0 mapped slots`).
- Replaced the remove-button test with a deterministic add → assert → remove → assert lifecycle test that uses the mapping add form and a unique note/velocity pair.

## Suggested additions

1. Clip editor empty state: global duration is blank + disabled. ✓
2. Clip editor with staged frames: global duration is populated + enabled. ✓
3. Deterministic mapping row lifecycle: add → assert → remove → assert. ✓

## Affected files

- `e2e/mainframe.spec.js`

## Verification

- `npm run lint` passes.
- `npm run test -w mainframe` passes.
- `npx playwright test e2e/mainframe.spec.js` passes.
- `npm run build -w mainframe` passes.

## Notes

- These are E2E-tier test fixes; no product behavior change is intended.
- The blank-when-disabled global-duration behavior remains correct in `ClipEditorController`; the tests now reflect it.
