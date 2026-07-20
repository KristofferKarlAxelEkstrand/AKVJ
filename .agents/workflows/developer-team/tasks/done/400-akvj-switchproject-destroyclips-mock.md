---
status: done
assignee: akvj-developer
priority: medium
review: machine
---

# Task 400: switchProject destroyClips mock assertion

## Source

Test Marshal `[TEST]-akvj-switchproject-destroyclips-mock.md`

## Description

Test-only. `akvj/test/AdventureKidVideoJockey.test.js` — `destroyClips` spy under suite mocks is vacuous (`#loadedClips` stays `{}`). Seed a prior catalog, assert `destroyClips` called with that catalog (and ideally nested destroy), keep real `clearClips` / mask / effects expectations.

## Verification

- `npm run test -w akvj` / `npm run lint -w akvj` pass
