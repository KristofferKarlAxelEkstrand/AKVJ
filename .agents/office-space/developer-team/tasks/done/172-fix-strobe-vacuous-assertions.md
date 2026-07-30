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

# Task 172: Fix Vacuous Conditional Assertions in Renderer.strobe.test.js

## Source
`.agents/workflows/developer-team/inbox/[TEST]-akvj-test-organization-coverage.md`
(Test Marshal Sweep 6 — 1 actionable item; all previously filed gaps confirmed resolved).

## Problem
`akvj/test/Renderer.strobe.test.js` lines 95–101 and 117–122 use `if (displayContext.putImageData.mock.calls.length === 0)` to guard assertions. This is tautological — the test passes regardless of whether the strobe effect actually rendered.

## Fix
- **Low-intensity off-phase test (lines 95–101):** Determine expected behavior deterministically. If strobe should NOT flash at this phase, assert `putImageData` was NOT called unconditionally. If it should flash, assert the pixel value unconditionally. Remove the `if/else` branch.
- **High-intensity off-phase test (lines 117–122):** Same — pick one expected behavior and assert it unconditionally. Remove the `if/else` branch.

## Verification
- `npm run test -w akvj`
- `npm run lint`

## Files
- `akvj/test/Renderer.strobe.test.js`
