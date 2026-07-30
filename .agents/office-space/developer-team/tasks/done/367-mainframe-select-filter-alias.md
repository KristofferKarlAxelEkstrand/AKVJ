---
status: done
assignee: qa-reviewer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 367: Align `select`≡`filter` in KeyBed + fix stale tests

## Source

Test Marshal `[TEST]-mainframe-select-filter-alias-coverage.md`

## Description

PianoRoll chrome already treats `select` as a legacy alias for `filter`. `KeyBed.setMappedKeys` still treats `select` like `play` (clears velocity bands). Align product, then update tests.

### Product

- [ ] `mainframe/src/js/KeyBed.js`: `select` follows the same branch as `filter` / `edit` (build velocity bands), not `play`

### Tests

- [ ] `mainframe/test/PianoRoll.test.js` — drop/replace assertions that lock bare-picker `select`; expect regions/dimming like `filter`; assert `mode="select"` lights Filter button and shows filter view
- [ ] `mainframe/test/KeyBed.test.js` — `setMappedKeys(..., 'select')` builds the same velocity bands as `'filter'`

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes
- `npm run build -w mainframe` passes
