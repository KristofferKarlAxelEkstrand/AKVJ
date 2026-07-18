# [BUG] `sync: "beat"` with no `syncLength` passes validation, silently ignored at runtime + zero test coverage for new validation

## Where
- `mainframe/scripts/clips/lib/validate/meta.js` — `validateSyncFields()`, lines 138-162 (Task 136, currently in QA review as part of the Clip Timing & Sync epic).
- `akvj/src/js/visuals/clipMetadata.js` — `resolveTotalBeats()`, lines 186-206.

## Problem 1: validation gap
`validateSyncFields()` validates `sync`, `syncLength`, `syncBeats`, and `beatsPerBar` independently, and separately requires `syncBeats` when `syncLength === 'custom'` (line 159-161). But there is no check that `syncLength` is actually **present** when `sync === 'beat'`. A `meta.json` with just:
```json
{ "sync": "beat" }
```
passes `npm run clips` validation cleanly (no `syncLength` key at all → the `meta.syncLength !== undefined` guard on line 144 skips validation entirely for it). At runtime, `clipMetadata.js#resolveTotalBeats` falls through every branch (`syncLength` is `undefined`, matches neither `PRESET_BEATS`, `PRESET_BARS`, nor `'custom'`) and returns `null`, so `frameDurationBeats` ends up `null` and the clip silently plays with default FPS/free timing — completely ignoring the author's stated `sync: "beat"` intent, with **no error or warning anywhere in the pipeline**.

This is a deliberate, tested engine-side behavior at the akvj layer (confirmed via `akvj/test/clipMetadata.test.js` — `'invalid syncLength returns null frameDurationBeats'` and `'custom without syncBeats returns null frameDurationBeats'` both explicitly assert the silent-null fallback, and that's the right call for the *engine* — never throw/crash the render loop over bad metadata). But per the task's own stated division of labor ("Mainframe only validates shape so hand-authors get clear errors from `npm run clips`"), the **mainframe validation layer** is supposed to be the place that catches exactly this kind of incomplete authoring before it ships. Right now it doesn't catch the "said `sync: beat`, forgot `syncLength`" case — only catches an explicitly-wrong `syncLength` value (bogus string) or a `syncLength: 'custom'` missing `syncBeats`.

Given `clip-schema.md`'s "Human First" Golden Rule (hand-authored `meta.json` should give a human clear, immediate errors), this is a real, plausible mistake — a hand-author sets `"sync": "beat"` first, forgets to add the length preset, runs the pipeline, sees no errors, and only discovers their clip isn't actually beat-synced by noticing it doesn't look right during a live set.

## Suggested Fix
In `validateSyncFields()`, add: if `meta.sync === 'beat'` and `meta.syncLength === undefined`, push an error like `` `syncLength is required when sync is "beat"` ``.

## Problem 2: zero test coverage for the new mainframe validation
Task 136's own "Suggested Tests" section asked for `mainframe/test/validate-extended.test.js` (or similar) coverage of the new field validation (shape checks, `syncBeats` required-iff-custom, invalid preset/enum rejected). Grepped `mainframe/test/` and `akvj/test/` for `validateSyncFields`/`syncLength`/`SYNC_MODES` — the **only** hits are in `akvj/test/clipMetadata.test.js` (engine-side expansion tests, which are thorough and good). There is no test file anywhere exercising `validateSyncFields()` itself. Writing that suite would very likely have caught Problem 1 directly, since "sync: beat with no syncLength" is an obvious first case to try.

## Priority
Medium — no data loss or crash risk (confirmed the engine degrades gracefully), but it's a real authoring footgun with zero test coverage in freshly-written, still-in-QA code that 3 more slices (137-139) will build on top of. Worth fixing in this slice before the mainframe editor (slice 2) mirrors the same validation gap into its own live-preview logic.
