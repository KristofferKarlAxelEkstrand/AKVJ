---
status: done
assignee: akvj-developer
priority: high
epic: refactor-for-greatness-2
---

# Task 279 (P0-1): Commit projects layout and retire legacy clips pool

Part of `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md`.

## Goal

After this task, `git clone && npm install && npm run build` succeeds with all clip source.

## Changes

- Run `git add projects/` to stage the new source tree.
- Run `git rm --cached clips/` to stage deletion of 62 tracked legacy files.
- Investigate `clips/t6gf/` (untracked, 47 bytes): is it a test artifact? Move to `projects/default/clips/t6gf/` or delete.
- **Human commits required:** The developer should stage the changes and report ready to commit. The Team Lead / human will review and commit with message: `chore: durability — migrate clip source to projects layout, retire flat pool`.

## Verify

- `git ls-files projects/` returns the full tree.
- `git ls-files clips/` returns empty (0 files).
- `npm run clips` succeeds (validates and generates output).

## Affected files

- `projects/`
- `clips/` (retired)
- `clips/t6gf/` (untracked investigation)

## Notes

- Do not commit or push without explicit human approval.
- If the untrusted `clips/t6gf/` is a test artifact, preserve it under `projects/default/clips/t6gf/` if it has value; otherwise delete.
