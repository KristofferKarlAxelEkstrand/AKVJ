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

# 442 — Projects API error paths untested

From: `[TEST]-mainframe-projects-api-error-paths.md` (test-marshal). Test-only —
extend `mainframe/test/server.test.js` Projects block (real tmp projects dir).

## Checklist

1. POST create — 400 empty name (`/name is required/i`)
2. POST create — 400 invalid id (`/Invalid project id/i`)
3. POST create — 409 duplicate (`/already exists/i`) — no 409 asserts in suite today
4. POST create — missing `copyFrom` source → 404
5. PUT update — 400 empty name / bad settings
6. GET/PUT/DELETE/activate — 404 missing project
7. Active-project fallback — corrupt/`not-a-valid-id` → `default`

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.
