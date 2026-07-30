---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 342: Mainframe PUT /api/clips meta validation

## Source

Human review `mail/in/[REVIEW]-mainframe-2026-07-20.md` finding 2

## Description

`mainframe/server/handlers/clips.js:342-357` whitelists 21 keys but only type-checks `png`. Invalid values such as `{"frames":"banana"}` return 200 and land in `meta.json`, which later breaks `npm run clips` and silently drops the clip in AKVJ's `ClipLoader`.

Fix: reuse the pipeline's `mainframe/scripts/clips/lib/validate/meta.js` to validate values before writing `meta.json`. Return `400` for invalid value shapes.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes (extend `mainframe/test/server.test.js:576` area to cover value shape)
- `npm run build -w mainframe` passes
- `PUT /api/clips/:clipId` with `{"frames":"banana"}` returns 400
