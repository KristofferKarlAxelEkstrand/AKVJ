---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 299: Remove vacuous assertion in `akvj/test/ClipTiming.test.js`

## Source

Test Marshal sweep: `.agents/workflows/developer-team/mail/in/read/[TEST]-akvj-mainframe-flake-and-preview-coverage.md`

## Description

`akvj/test/ClipTiming.test.js` line 253 contains a placeholder assertion `expect(true).toBe(true)` inside the test "random/shuffle: sync fields are irrelevant — not exercised here...". The comment explains that the behavior lives in `Clip.js`, so the test passes no matter what and does not exercise any code path. This inflates pass counts without adding confidence.

## Proposed actions

1. Remove the placeholder test block, **or**
2. Move the assertion to `Clip.test.js` verifying that `Clip` does **not** pass `syncBeats` to `ClipTiming` for `random`/`shuffle` playback modes.

## Affected files

- `akvj/test/ClipTiming.test.js`
- Optionally `akvj/test/Clip.test.js`

## Verification

- `npm run test -w akvj` passes.
- `npm run lint` passes.

## Notes

- No runtime behavior changes.
