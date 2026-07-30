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

# 485 — AppState clock dropout keeps BPM + CC reclaim tests

From: `mail/in/read/[TEST]-clip-timing-clock-dropout-and-preview-fallback.md` (test-marshal). Tests only — akvj half.

Extend `akvj/test/AppState.test.js` (`clock timeout`).

## Do

1. **Preserve last BPM on dropout** — drive clock to known BPM, timeout `clockTimeoutMs`, assert `state.bpm === clockBpm` (not reset to `settings.bpm.default`).
2. **CC reclaims after dropout** — after timeout (`bpmSource === 'default'`), send BPM CC; assert `bpmSource === 'cc'` and BPM updates.

Mainframe StagingPreview fallback half is task **486**.

## Verify

`npm run lint -w akvj`, `npm run test -w akvj`.

Scope: **akvj-developer**.
