---
status: done
assignee: utility-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 357: Update docs for githooks

## Source

- `mail/in/[FEATURE]-update-contributing-githooks.md`
- Quartermaster `[DEPS]-config-scripts-engines-health-2026-07-20-agents-githooks.md`

## Description

Update `CONTRIBUTING.md` and `AGENTS.md` to reflect that `.githooks/pre-commit` and `.githooks/pre-push` are tracked and armed by `run-team`. Replace the stale claim "No pre-commit hooks are configured" in both files.

## Affected files

- `CONTRIBUTING.md`
- `AGENTS.md` (Developer workflow / IDE tooling bullet ~L395)

## Verification

- `npx prettier --check .` passes
