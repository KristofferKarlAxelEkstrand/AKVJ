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

# 469 — shellUserFeedback non-Error / null fallback coverage

From: `[TEST]-mainframe-shelluserfeedback-error-shapes.md` (test-marshal). Test-only — extend `mainframe/test/shellUserFeedback.test.js`.

## Cover

1. `reportFailedClipOpen` — null/undefined/string/`{}` / empty `message` → `messages.error('Failed to open clip')`.
2. `reportFailedClipDelete` — string → includes detail; null/undefined → `Unknown error`.
3. `reportBootApiError` — string/null/undefined → `API error: …` via `String(error ?? 'Unknown error')`.

## Verify

`npm run test -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
