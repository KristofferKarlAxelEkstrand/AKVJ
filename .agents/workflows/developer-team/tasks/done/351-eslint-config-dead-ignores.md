---
status: done
assignee: utility-developer
priority: low
review: machine
---

# Task 351: Remove dead ignores from `eslint.config.js`

## Source

- `.agents/workflows/developer-team/mail/in/[DEPS]-config-health-2026-07-20-revisit.md`

## Description

`eslint.config.js` currently ignores `clips/**` and `.temp-repos/**`. Neither directory exists at the repo root, so these ignores are dead config. Remove them while keeping the valid `.cache/**` ignore.

## Verification

- `npm run lint` still passes
- `npm run test` passes
- No new lint errors in `clips/**` or `.temp-repos/**` (they do not exist)
