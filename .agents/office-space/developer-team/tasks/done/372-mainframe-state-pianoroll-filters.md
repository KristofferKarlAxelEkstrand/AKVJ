---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 372: Unit-test `mainframeState.pianorollFilters`

## Source

Test Marshal `[TEST]-mainframe-state-pianoroll-filters.md`

## Description

ClipList filtering and AkvjMainframe wiring are tested; `mainframeState.pianorollFilters` itself is not. Test-only — no product source changes.

## Checklist

- [ ] `mainframe/test/mainframeState.test.js` — import `EVENT_PIANOROLL_FILTERS_CHANGED`
- [ ] Default `pianorollFilters` is `{}` on create
- [ ] Setter dispatches once with `{ filters: next }` on change
- [ ] Same JSON-equal shape does not re-dispatch
- [ ] Non-object / null / undefined coerce to `{}` and dispatch when previous was non-empty
- [ ] `reset()` clears `pianorollFilters` to `{}` (extend existing reset test; still no events)

## Verification

- `npm run test -w mainframe` passes
- `npm run lint -w mainframe` passes
