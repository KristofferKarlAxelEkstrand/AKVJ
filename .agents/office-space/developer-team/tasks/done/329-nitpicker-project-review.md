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

# Task 329: Nitpicker project review lane check

Run a naming/semantics/readability sweep on the current repo and report findings.

## Scope

- `akvj/src/js/` and `mainframe/src/js/`, `mainframe/server/`, `mainframe/scripts/`
- Test files and comments

## Checks

1. Spot inconsistent naming (camelCase vs kebab-case tags, file/class/tag mismatches, vague variable names).
2. Look for dead comments, stale TODOs, or misleading terminology.
3. Check for magic numbers or string literals that should be named constants.
4. Verify custom-element tag prefixes (`akvj-*`) and event naming consistency.

## Output

Write a `[NIT]-329-nitpicker-project-review-YYYY-MM-DD.md` to `mail/in/` with a checklist of issues for the Team Lead to triage. Do not edit source files directly.
