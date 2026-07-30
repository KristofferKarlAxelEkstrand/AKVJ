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

# Task 327: AKVJ project review lane check

Run the AKVJ lane checks on the current repo and report findings.

## Scope

- `akvj/src/js/`, `akvj/test/`
- Vite build, lint, unit tests, E2E config (browser binary may be unavailable)

## Checks

1. Run `npm run lint -w akvj`.
2. Run `npm run test -w akvj`.
3. Run `npm run build -w akvj`.
4. Run `npx playwright test --list` to verify E2E config loads (skip full run if Chromium is not installed).
5. Spot-check for stale paths referencing old flat `clips/` or `akvj/src/public/clips/` instead of `projects/{projectId}/clips/`.
6. Note any failing tests, lint errors, build warnings, or suspicious dead code.

## Output

Write a `[REPORT]-327-akvj-project-review.md` to `slack/team-lead/` summarizing results and any follow-up tasks needed.
