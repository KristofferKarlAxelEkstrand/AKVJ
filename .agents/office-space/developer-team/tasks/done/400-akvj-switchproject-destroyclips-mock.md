---
status: done
assignee: akvj-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 400: switchProject destroyClips mock assertion

## Source

Test Marshal `[TEST]-akvj-switchproject-destroyclips-mock.md`

## Description

Test-only. `akvj/test/AdventureKidVideoJockey.test.js` — `destroyClips` spy under suite mocks is vacuous (`#loadedClips` stays `{}`). Seed a prior catalog, assert `destroyClips` called with that catalog (and ideally nested destroy), keep real `clearClips` / mask / effects expectations.

## Verification

- `npm run test -w akvj` / `npm run lint -w akvj` pass
