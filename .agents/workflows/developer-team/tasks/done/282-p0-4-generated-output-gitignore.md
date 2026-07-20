---
status: done
assignee: akvj-developer
priority: high
epic: refactor-for-greatness-2
---

# Task 282 (P0-4): Set generated-output gitignore policy

Part of `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md`.

## Goal

Stop generated output from appearing in `git status` and keep the root `active-project.json` source file tracked.

## Findings

1. `akvj/src/public/projects/` and `akvj/src/public/active-project.json` are still tracked in the git index (`git ls-files` lists them). Adding them to `.gitignore` does not remove them from `git status`; they will keep showing up as modified whenever `npm run clips` updates them.
2. `.gitignore` and `.prettierignore` both contain `/active-project.json`, which incorrectly ignores the root source file. The task explicitly says root `active-project.json` is source and should stay tracked. Only `akvj/src/public/active-project.json` should be ignored.

## Changes

- Run `git rm --cached -r akvj/src/public/projects/ akvj/src/public/active-project.json` to remove the generated files from the index.
- Remove `/active-project.json` from `.gitignore` and `.prettierignore`.
- Ensure `akvj/src/public/projects/` and `akvj/src/public/active-project.json` are still ignored (they are already listed or should be added).
- Keep source in git: `projects/`, `projects/index.json`, root `active-project.json`.

## Verify

- `npm run clips` runs successfully.
- `git status --short` is clean (no untracked/modified generated output).
- Root `active-project.json` remains tracked (`git ls-files active-project.json` returns the file).
- `npm run lint` passes.

## Affected files

- `.gitignore`
- `.prettierignore`
- `akvj/src/public/projects/` (git index only)
- `akvj/src/public/active-project.json` (git index only)

## Notes

- This is Priority 0; complete after P0-1 lands.
- Do not commit or push without explicit human approval; stage the `git rm --cached` changes and report ready for human commit.
