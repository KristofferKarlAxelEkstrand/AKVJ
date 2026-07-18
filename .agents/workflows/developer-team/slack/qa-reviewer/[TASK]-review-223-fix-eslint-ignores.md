---
status: completed
assignee: mainframe-developer
---

# [REPORT] Fix ESLint Config to Ignore Workflow-Generated Directories

## Task
Task 223: Update `eslint.config.js` to ignore `.temp-repos/**` and `devin-team-controller/**`.

## Changes
- `eslint.config.js`: added `.temp-repos/**` and `devin-team-controller/**` to the `ignores` array.

## Verification
```bash
npm run lint
```
Result: passed with no errors.

Lint still covers `akvj/`, `mainframe/`, and `monorepo-scripts/` sources; only the two workflow artifact directories are excluded.

## Files Modified
- `/workspaces/AKVJ/eslint.config.js`
