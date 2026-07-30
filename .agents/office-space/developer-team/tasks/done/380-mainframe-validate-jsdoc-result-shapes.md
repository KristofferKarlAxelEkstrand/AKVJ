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

# Task 380: Fix validate/ JSDoc result shapes

## Source

Nitpicker `[NIT]-validate-jsdoc-result-shapes-2026-07-20.md`

## Description

JSDoc-only — no behaviour change.

- [ ] `mainframe/scripts/clips/lib/validate/index.js` `ValidationResult` typedef — add `dir: string`
- [ ] Same file `validate()` `@returns` — `errors` items use `clipId`, not `path`

## Verification

- `npm run lint -w mainframe` passes
