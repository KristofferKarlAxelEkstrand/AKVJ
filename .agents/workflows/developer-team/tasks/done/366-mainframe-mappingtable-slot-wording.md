---
status: done
assignee: qa-reviewer
priority: low
---

# Task 366: MappingTable “slot” → “mapping” wording

## Source

Nitpicker `[NIT]-mapping-spec-keybed-omission-2026-07-20.md` (code half only)

## Description

In `mainframe/src/js/MappingTable.js`, rename `slotCount` / summary copy / JSDoc away from “slot” (Layer Group language) to mapping-entry wording:

- `slotCount` → `mappingCount`
- `` `${n} mapped slot(s)` `` → `` `${n} mapping(s)` `` (or “mapped entr(y/ies)”)
- JSDoc “mapped slot count” → matching language

Also update test companions (same wording — from `[NIT]-mapping-slot-wording-test-companions-2026-07-20.md`):

- `e2e/mainframe.spec.js` (~L167) `'0 mapped slots'` → match new copy
- `mainframe/test/MappingTable.test.js` — summary expectations / titles (`'1 mapped slot'`, `'2 mapped slots'`, `'0 mapped slots'`)

## Note

`mapping.md` KeyBed omission items from the same nit are escalated to Overseer — developers do not edit `spec/`.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes
