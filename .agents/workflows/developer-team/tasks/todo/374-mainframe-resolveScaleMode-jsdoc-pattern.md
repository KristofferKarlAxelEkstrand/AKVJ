---
status: backlog
assignee: none
priority: low
review: machine
---

# Task 374: `resolveScaleMode` JSDoc include `pattern`

## Source

Nitpicker `[NIT]-shared-resolveScaleMode-jsdoc-pattern-2026-07-20.md`

## Description

JSDoc-only — no behaviour change.

- [ ] `mainframe/shared/frameFit.js` `resolveScaleMode` `@returns` add `'pattern'` to match `SCALE_MODES`

## Verification

- `npm run lint -w mainframe` passes
