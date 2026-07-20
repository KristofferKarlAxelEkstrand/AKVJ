---
status: backlog
assignee: none
priority: low
review: machine
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
