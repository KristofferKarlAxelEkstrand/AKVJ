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

# Task 350: Mainframe still writes rejected `frameDurationBeats`

## Source

- `.agents/workflows/developer-team/mail/in/[BUG]-mainframe-writes-rejected-frameDurationBeats-2026-07-20.md`
- `.agents/workflows/developer-team/mail/in/[BUG]-mainframe-frameDurationBeats-write-repro-2026-07-20.md`

## Description

`frameDurationBeats` was removed from the engine and the clip pipeline now rejects it (`mainframe/scripts/clips/lib/validate/meta.js:17`), but the mainframe server write path still accepts and persists it:

- `mainframe/server/clipFramesBody.js:35,53` — parses `frameDurationBeats` off the request body
- `mainframe/server/handlers/clips.js:161,215` — passes it into create/update
- `mainframe/server/handlers/clips.js:296` — it is in `EDITABLE_META_FIELDS`
- `mainframe/server/spritesheet.js:313,357` — writes it into `meta.json`

Strip the field from the write path and the editable-field whitelist. Clients that send it should no longer have it persisted.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes
- `npm run build -w mainframe` passes
- `POST /api/clips` and `PUT /api/clips/:clipId` with `frameDurationBeats` reject or do not persist the key to `meta.json`
