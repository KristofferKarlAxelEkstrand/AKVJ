---
status: done
assignee: none
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 330: Test Marshal project review lane check

Run a systemic test-health sweep on the current repo and report findings.

## Scope

- `akvj/test/`, `mainframe/test/`, `e2e/`, `monorepo-scripts/test/`
- Vitest/Playwright configs and coverage reports

## Checks

1. Identify untested or under-tested modules (especially new extractions from recent refactors).
2. Look for flaky, skipped, or environment-conditional tests.
3. Spot test duplication or vacuous assertions (`expect(true).toBe(true)` patterns).
4. Verify test timeout configurations are consistent and reasonable.

## Output

Write a `[TEST]-330-test-marshal-project-review-YYYY-MM-DD.md` to `mail/in/` with a checklist of coverage/flake gaps for the Team Lead to triage. Do not edit source files directly.
