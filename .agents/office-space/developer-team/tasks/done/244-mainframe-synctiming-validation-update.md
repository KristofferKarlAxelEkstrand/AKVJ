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

# Task 244: Mainframe `syncTiming.js` Mirror + Hard-Reject `frameDurationBeats`

## Epic
`.agents/workflows/developer-team/epics/sync-to-bpm-redesign.md` — Phase 4

## Source
`.agents/workflows/developer-team/spec/featue-how-sync-to-bpm-works-for-clips.md`
(Sync-to-BPM Redesign — human-approved spec)

## Affected Files
- `mainframe/scripts/clips/lib/syncTiming.js` (or wherever the manually-mirrored copy of
  akvj's `clipMetadata.js` sync-resolution logic lives — grep for
  `expandSyncToFrameDurationBeats` / `frameDurationBeats` under `mainframe/`)
- `mainframe/scripts/clips/lib/validate/meta.js` (or wherever `meta.json` sync fields
  are validated — grep for `frameDurationBeats`, `syncLength`, `syncBeats` under
  `mainframe/scripts/clips/lib/validate/`)

## Description
Mainframe keeps a manually-mirrored copy of akvj's sync-resolution logic
(`syncTiming.js`, per existing precedent — see task 242's sibling change in akvj's
`clipMetadata.js`). This task mirrors that change and updates validation:

1. **Mirror the resolution change**: remove `frameDurationBeats` expansion, resolve
   `syncLength` → `syncBeats` only (same logic as task 242's akvj-side change — keep the
   two implementations in sync, they're intentionally not shared code per existing
   convention).
2. **Hard-reject `frameDurationBeats` in validation**: `meta.json` files containing a
   `frameDurationBeats` field must fail validation with a clear error. This project is
   in alpha — there is no legacy-fallback requirement, this is a hard error, not a
   deprecation warning.
3. **Validate the new sync model**: confirm `sync: "beat"` clips have either a valid
   `syncLength` preset or (`syncLength: "custom"` + numeric `syncBeats`), matching the
   existing validation patterns for other clip metadata fields.

Do not migrate existing clip content in this task — that's task 245, which depends on
this task's validation change landing first (so the migrated clips actually pass).

## Discrete Actions
1. Update `syncTiming.js` (or equivalent) to mirror task 242's resolution logic.
2. Add a hard validation error for any `meta.json` containing `frameDurationBeats`.
3. Add/update validation for `sync` / `syncLength` / `syncBeats` per the new model.
4. Update mainframe's clip editor UI if it currently exposes `frameDurationBeats` as an
   author-facing field (check `mainframe/src/js/` for any UI still referencing it,
   e.g. the clip editor's sync fields) — remove/replace with the `syncBeats`-only model
   if present.

## Verification
- Add a validation test asserting a `meta.json` with `frameDurationBeats` fails with a
  clear error message.
- Update/add tests for `syncTiming.js` mirroring task 242's test cases.
- Run `npm run lint && npm run test -w mainframe && npm run build -w mainframe`.

## Related
- Mirrors task 242 (akvj `clipMetadata.js`) — keep resolution logic in sync between the
  two manually-duplicated modules.
- Blocks task 245 (clip migration) — the 5 existing clips can't be migrated to the new
  format until this task's validation accepts it.
- Independent of tasks 241/242/243 (akvj-side) — can run in parallel.
