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

# 490 — Create/update frames must validateMetaFields before write

From: `mail/in/read/[BUG]-mainframe-frames-save-skips-meta-validate.md` (overseer).

## Bug

`handlePutClipMeta` validates; **create/update frames** (`createClipFromFrames` / `updateClipFromFrames` → `buildClipMeta` → `writeJsonAtomic`) does not. Bad meta can land on disk (ms length ≠ frames, non-positive ms, incomplete beat-sync).

## Fix

After building/merging meta (with `frameCount`), run `validateMetaFields` and fail the request before writing sprite/meta. Align with meta-only PUT.

## Where

- `mainframe/server/spritesheet.js` — `writeClipFiles` / `overwriteClipFiles` / `buildClipMeta`
- Callers: `mainframe/server/handlers/clips.js`

## Tests

API: PUT frames with `frameDurationsMs` length ≠ frame count → 400, no write.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
