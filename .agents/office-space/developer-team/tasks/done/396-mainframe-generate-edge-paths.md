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

# Task 396: generate.js skip / corrupt-meta edge tests

## Source

Test Marshal `[TEST]-mainframe-generate-edge-paths.md`

## Description

Test-only. Extend `mainframe/test/generate.test.js`:

- Invalid clipId folder skipped
- Corrupt meta.json still writes entry with png fallback
- No meta.json → `{ png: 'sprite.png' }` (or equiv)
- Optional: on-disk `clips.json` matches return

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
