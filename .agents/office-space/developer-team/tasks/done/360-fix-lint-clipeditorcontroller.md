---
status: done
assignee: mainframe-developer
priority: high
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 360: Fix lint error in ClipEditorController

## Source
- `mail/in/[BUG]-lint-clipeditorcontroller.md`

## Description
The global `npm run lint` command is currently failing due to an unused variable in `mainframe/src/js/ClipEditorController.js`:
`4:10  error  'DEFAULT_FALLBACK_FPS' is defined but never used  no-unused-vars`

Remove the unused variable to fix the build.
