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

# Task 378: Preview nearest-lock JSDoc (PreviewClip / StagingPreview)

## Source

Nitpicker `[NIT]-preview-nearest-lock-docs-2026-07-20.md` (code half; `clip-format.md` → Overseer)

## Description

JSDoc-only — no behaviour change. Add one line each: always nearest-neighbour; does **not** honor meta `scaling: "smooth"`.

- [ ] `mainframe/src/js/StagingPreview.js` class JSDoc
- [ ] `mainframe/src/js/PreviewClip.js` class JSDoc

## Verification

- `npm run lint -w mainframe` passes
