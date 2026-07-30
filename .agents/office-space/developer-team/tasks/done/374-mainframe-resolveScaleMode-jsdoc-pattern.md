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

# Task 374: `resolveScaleMode` JSDoc include `pattern`

## Source

Nitpicker `[NIT]-shared-resolveScaleMode-jsdoc-pattern-2026-07-20.md`

## Description

JSDoc-only — no behaviour change.

- [ ] `mainframe/shared/frameFit.js` `resolveScaleMode` `@returns` add `'pattern'` to match `SCALE_MODES`

## Verification

- `npm run lint -w mainframe` passes
