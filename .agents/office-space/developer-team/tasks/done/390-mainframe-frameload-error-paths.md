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

# Task 390: frameLoad error-path unit tests

## Source

Test Marshal `[TEST]-mainframe-frameload-error-paths.md`

## Description

Test-only. Cover throw paths in `loadClipFrameBuffers`:

- Invalid `clipId`
- Unknown clip (no meta.json)
- Meta but no raw/sprite → `/No frames found/`
- Sprite path missing/invalid `frames` / `framesPerRow`

File: `mainframe/test/frameLoad.test.js`

## Verification

- `npm run test -w mainframe` / `npm run lint -w mainframe` pass
