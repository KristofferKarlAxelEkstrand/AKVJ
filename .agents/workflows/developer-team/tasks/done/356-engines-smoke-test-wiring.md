---
status: done
assignee: qa-reviewer
priority: medium
---

# Task 356: Workspace engines and unreferenced smoke test

## Source

Quartermaster `[DEPS]-config-scripts-engines-health-2026-07-20-followup.md`

## Description

Resolve the remaining config/scripts/engines hygiene findings that do not require a human commit.

## Checklist

- [ ] Add `"engines": { "node": ">=20" }` to `akvj/package.json`.
- [ ] Add `"engines": { "node": ">=20" }` to `mainframe/package.json`.
- [ ] Decide whether `akvj/test/smoke/akvj-startup.smoke.js` should be wired into a smoke-test script or removed; implement the decision.

## Affected files

- `akvj/package.json`
- `mainframe/package.json`
- `akvj/test/smoke/akvj-startup.smoke.js`

## Verification

- `npm run lint` passes (root)
- `npm run test:smoke` or the chosen smoke script passes, or the file is removed and no script references it
- `npm run build` passes (root)
