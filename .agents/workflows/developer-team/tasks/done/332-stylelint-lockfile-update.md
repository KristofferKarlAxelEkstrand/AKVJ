---
status: done
assignee: team-lead
priority: low
---

# Task 332: Stylelint patch update + lockfile refresh

## Source

Quartermaster `[DEPS]` ticket: `mail/in/[DEPS]-stylelint-lockfile-2026-07-20.md`

## Action

Update root `stylelint` from `17.14.0` to `17.14.1` within the declared `^17.14.0` range by refreshing `package-lock.json`.

## Verification

- `npm ls stylelint --depth=0` reports `stylelint@17.14.1`.
- `npm run lint:css` passes.

## Notes

No `package.json` changes needed; only the lockfile is refreshed. `npm audit` returned 0 vulnerabilities.
