---
status: done
assignee: utility-developer
priority: high
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 494 — e2e clip editor targets stale `#clip-frames-global-duration`

From: `mail/in/read/[BUG]-e2e-clip-frames-global-duration-id-stale.md` (field-tester). Fallout from **493** DOM rename.

## Bug

`e2e/mainframe.spec.js` still uses `#clip-frames-global-duration` (lines ~151–152, 163–164). Product id is `#clip-frames-global-duration-ms`. Two e2e tests fail solidly.

## Fix

Update locators to `#clip-frames-global-duration-ms` (and any sibling `set-all` ids if present).

## Verify

```bash
npx playwright test e2e/mainframe.spec.js:143 e2e/mainframe.spec.js:156
# or full: npm run test:e2e
```

Scope: **utility-developer** (`e2e/`).
