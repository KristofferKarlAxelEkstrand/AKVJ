---
status: completed
assignee: akvj-developer
priority: high
---

# Task 336: Fix CI prettier drift

## Source

- Human review `mail/in/[REVIEW]-akvj-src-2026-07-20.md` finding 1
- Human review `mail/in/[REVIEW]-mainframe-2026-07-20.md` finding 4

## Description

`npx prettier --check .` is failing in CI. The `akvj` review calls out tab-only blank lines in `akvj/src/js/visuals/ClipLoader.js`; the `mainframe` review calls out 18 files across `mainframe/` that fail `prettier --check`.

Run `npm run format:prettier` and verify `npx prettier --check .` passes. If `.devin/`, `docs/`, or `test-results/` files are still flagged, add them to `.prettierignore` or `.gitignore` as appropriate so formatting stays scoped to source.

## Verification

- `npx prettier --check .` passes
- `npm run lint` still passes
- `npm run test` still passes
