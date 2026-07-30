---
status: done
assignee: mainframe-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 388: ClipEditorController GIF+images batch — no expand

## Source

Test Marshal `[TEST]-mainframe-clipeditor-gif-batch.md`

## Description

Test-only. When GIF is mixed with other images (or two GIFs), expand must not run; each GIF is first-page-only.

- [ ] `mainframe/test/ClipEditorController.test.js` — GIF+PNG: `/api/expand-gif` not called; 2 staged frames
- [ ] Two GIFs: expand not called; 2 staged frames
- Keep existing lone-animated / static / error cases

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
