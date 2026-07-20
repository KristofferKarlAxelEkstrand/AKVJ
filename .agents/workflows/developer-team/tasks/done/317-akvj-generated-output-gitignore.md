---
status: done
assignee: mainframe-developer
priority: high
---

# Task 317: AKVJ generated-output gitignore / git index cleanup

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-282-generated-output-still-tracked-and-root-active-ignored.md`

## Description

Clean up `.gitignore` / `.prettierignore` policy for generated `akvj/src/public/` output and ensure the root `active-project.json` source file stays tracked.

## Findings and actions

### 1. Remove generated `akvj/src/public/` tree from git index

- Ran `git rm --cached -r akvj/src/public/projects/ akvj/src/public/active-project.json`.
- `git ls-files akvj/src/public/` no longer lists `projects/` or `active-project.json`.
- The deletions are staged and ready for human commit per the original P0-4 task instruction: "Do not commit or push without explicit human approval; stage the `git rm --cached` changes and report ready for human commit."

### 2. Fix root `active-project.json` ignore rule

- Confirmed `.gitignore` and `.prettierignore` no longer contain a root `/active-project.json` rule.
- The generated `akvj/src/public/active-project.json` and `akvj/src/public/projects/` remain ignored.
- The source `active-project.json` at repo root is still tracked (`git ls-files active-project.json` returns it).

### 3. Verify clean generated output

- Ran `npm run clips`; it completed successfully.
- After running `npm run clips`, `git status --short` shows no `M` or `??` entries under `akvj/src/public/` (the generated files are ignored and are not re-modified by the pipeline).
- The remaining `D` entries for `akvj/src/public/` are the staged `git rm --cached` deletions; once a human commits them, `git status --short` will be fully clean for generated output.

## Affected files

- `.gitignore`
- `.prettierignore`
- `akvj/src/public/projects/` (git index)
- `akvj/src/public/active-project.json` (git index)

## Verification

- `npm run lint` — passed
- `npm run test` — passed (akvj: 535 tests; monorepo scripts passed)
- `npm run build` — passed
- `npm run clips` — completed successfully
- `git ls-files akvj/src/public/` no longer includes generated `projects/` or `active-project.json`
- Root `active-project.json` is still tracked (`git ls-files active-project.json` returns it)

## Notes

- No source behavior changes; only version-control hygiene.
- The staged deletions are intentionally not committed, awaiting human approval, per task 282 instructions.
