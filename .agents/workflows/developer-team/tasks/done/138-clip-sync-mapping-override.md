---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 138: Clip Timing & Sync — Slice 3: Per-Placement Mapping Override

## Depends On
Task 136 (schema + normalize) — **done**, report confirms exact field names used:
`sync`/`syncLength`/`syncBeats`/`beatsPerBar`, `SYNC_MODES`/`SYNC_LENGTH_PRESETS`/
`DEFAULT_BEATS_PER_BAR`/`DEFAULT_SYNC_MODE` constants in `clipMetadata.js` (akvj, mirrored in
`mainframe/shared/clipSchema.js`). This task is ready to pick up.

## akvj-Side Runtime Already Handles This — No New akvj Code Needed (verified)
Traced the trigger/resolution path in `akvj/src/js/visuals/ClipLoader.js`: mapping leaves
already support an object form for a **different** override use case (triggerType/
triggerGroup, see the JSDoc at `ClipLoader.js:281-283`):
- `#parseMappingValue()` (`ClipLoader.js:311-319`) already treats any leaf that isn't a bare
  string as `{ clipId, ...overrides }` — generic, not field-specific.
- `#loadMappedClip()` (`ClipLoader.js:112,121`) does `mergedMetadata = { ...clipMetadata,
  ...overrides }` — a plain shallow merge onto the clip's base meta.
- `#createClip()` (`ClipLoader.js:87-89`) calls `normalizeClipMetadata(mergedMetadata)` on
  the **merged** result, which (post Task 136) already resolves `frameDurationBeats` from
  `sync`/`syncLength`/`syncBeats`/`beatsPerBar` if present.

**Net effect: a mapping leaf like `{ "clipId": "...", "sync": "beat", "syncLength": "1 bar",
"beatsPerBar": 4 }` already works end-to-end today, with zero additional akvj code.** This
task is therefore **mainframe-only** — validation/shape-checking so hand-authors and the
pipeline accept this leaf shape for the new fields specifically (today's validation only
knows about `triggerType`/`triggerGroup` as override keys, not the sync fields — see Required
Changes below).

## Source
Spec: `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md` (§ Proposed
model #1, § User flows #2, § Open questions — mapping override shape)

## Goal
Let the same clip be placed at different sync lengths in different `key-map.json` slots
without duplicating the clip (e.g. free in one slot, 1 bar in another, 2 bars in a third).

## Settled Decision — Mapping Override Shape
Current `key-map.json` leaves are bare clipId strings (confirmed:
`projects/default/key-map.json` — `"0": "c1-n0-v0"`; validated in
`mainframe/server/mappingService.js` `validateNestedVelocityEntry` which calls
`isValidClipId(clipId)` directly on the leaf). **Settled approach**: allow a leaf to be
**either** a bare string (unchanged, no override — the overwhelming majority of entries) **or**
an object `{ clipId, sync, syncLength, syncBeats, beatsPerBar }` when overriding. This keeps
non-overridden entries untouched (zero diff, fully hand-editable) and only grows the ones
that actually need an override — better fit for the hand-editable Golden Rule than a
parallel sibling structure that could drift out of sync with the main mapping.

## Required Changes — Confirmed Pre-Existing Gap, Not Just Extension
Verified `mainframe/server/mappingService.js` `validateNestedVelocityEntry` (~line 133-146):
it receives the raw leaf value as its `clipId` parameter straight from `Object.entries(...)`
and immediately does `isValidClipId(clipId)` — which returns `false` for an object. **So the
object-leaf-with-overrides shape akvj's `ClipLoader.js` already runtime-supports (for
`triggerType`/`triggerGroup`) is not validated at all today — a hand-authored override object
would currently be flagged as an error by `npm run clips`/`validateMapping`, even though the
runtime handles it fine.** This task needs to:
1. Add generic dual-shape leaf support to `validateNestedVelocityEntry` (and the
   flatten/nest helpers around `mappingService.js:21,47`): bare string → validate as today;
   object → validate `clipId` the same way, then validate whatever override keys are present.
   This retroactively fixes the un-validated `triggerType`/`triggerGroup` override case too,
   not just adds sync.
2. Add `sync`/`syncLength`/`syncBeats`/`beatsPerBar` to the override-field validation, reusing
   Task 136's meta.json validation rules (same enums/ranges).
3. Mirror in `mainframe/scripts/clips/lib/validateMapping.js` / `collectNestedKeyMapErrors` so
   `npm run clips` catches the same issues as the live server API.
4. Mainframe UI (mapping editor / piano roll, if it exposes per-slot editing) may need surface
   for setting an override — check current UI capabilities first; this may be JSON-only for v1
   if there's no existing per-slot editing UI to extend.

## Suggested Tests
- `mappingService.test.js`: bare-string leaves unaffected; object leaves validate
  clipId + override fields (both the pre-existing triggerType/triggerGroup case and the new
  sync fields); invalid override shape rejected with clear error.
- `validateMapping.test.js`: same dual-shape coverage in the pipeline validator.
- Integration (no new akvj code, but worth a regression test): a clip placed twice with
  different sync overrides produces different `frameDurationBeats` at trigger time for each
  placement — exercises `ClipLoader.js`'s existing merge path end-to-end with the new fields.

## Files
- `mainframe/server/mappingService.js`
- `mainframe/scripts/clips/lib/validateMapping.js`
- `projects/*/key-map.json` (no data migration needed — new shape is additive/optional)
- No akvj files expected — `ClipLoader.js` already handles this generically (verified above)
