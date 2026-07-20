---
status: done
assignee: mainframe-developer
priority: medium
review: machine
---

# Task 394: Remove vacuous validate-image slots `Math.floor` mock

## Source

Test Marshal `[TEST]-mainframe-validate-image-slots-mock.md`

## Description

Test-only. The “too few frame slots” case spies `Math.floor` and is unreachable with real geometry after the height-divisibility guard.

- [ ] `mainframe/test/validate-image.test.js` — remove or replace that mock test

Product intent: Overseer confirmed **delete** the dead slots branch — task **395**. This task stays mock-test removal only.

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
