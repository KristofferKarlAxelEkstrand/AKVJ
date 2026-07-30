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

# Task 381: Fix vacuous SimpleRouter `popstate` test

## Source

Test Marshal `[TEST]-mainframe-simplerouter-popstate.md`

## Description

`popstate triggers route handler` has zero assertions and a broken setup. Test-only.

- [ ] `mainframe/test/SimpleRouter.test.js` — two routes; navigate then back/popstate; assert library handler called; optional `stop()` listener removal

## Verification

- `npm run test -w mainframe` passes
- `npm run lint -w mainframe` passes
