---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 326: Mainframe project review lane check

Run the mainframe lane checks on the current repo and report findings.

## Scope

- `mainframe/src/js/`, `mainframe/server/`, `mainframe/scripts/`, `mainframe/test/`
- Root config shared with mainframe (`vitest.config.js` at workspace root if applicable)

## Checks

1. Run `npm run lint -w mainframe`.
2. Run `npm run test -w mainframe`.
3. Run `npm run build -w mainframe`.
4. Spot-check for stale paths referencing old flat `clips/` or `akvj/src/public/clips/` instead of `projects/{projectId}/clips/`.
5. Note any failing tests, lint errors, build warnings, or suspicious dead code.

## Output

Write a `[REPORT]-326-mainframe-project-review.md` to `slack/team-lead/` summarizing results and any follow-up tasks needed.
