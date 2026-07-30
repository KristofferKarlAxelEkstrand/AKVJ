---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 370: Rename `writeJsonAtomic` param `data` → `value`

## Source

Nitpicker `[NIT]-server-writeJsonAtomic-serveSprite-2026-07-20.md` (param half; `serveSprite` folded into task 362)

## Description

Rename-only — no behaviour change.

- [ ] `mainframe/server/writeJsonAtomic.js` param `data` → `value` (or `jsonValue`); update JSDoc `@param`

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes
