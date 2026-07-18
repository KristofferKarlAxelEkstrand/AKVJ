---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 131: Short Clip IDs (4-char, Growing on Collision), Name-Derived, Live in Editor

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-simple-clip-ids.md`
Follow-up clarification (collision strategy): `.agents/workflows/developer-team/inbox/read/clarification-clip-id-collision-strategy.md`

## Important History — Read Before Starting
Task 102 (`tasks/done/102-unique-id-generation.md`) explicitly **removed** name-derived clip
IDs in favor of `crypto.randomUUID()`, and Task 109 deleted the resulting dead
`deriveClipId()` helper. **This task deliberately reverses that decision** per fresh user
direction — do not treat the old removal as a reason to push back; the user has now asked
for the opposite behavior. Just be aware the old `deriveClipId.js`/`deriveClipId` naming is
gone and shouldn't be resurrected verbatim — this is a new implementation, not a revert.

## Current State
- `mainframe/src/js/generateClipId.js` — `generateClipId()` returns `crypto.randomUUID()`
  (36 chars). Called once from `ClipEditorController.resetUploadClipId()`
  (`ClipEditorController.js:384-387`) when starting a new clip; the ID field stays editable
  (`readOnly = false`) until first save, then becomes read-only
  (`updateEditorChrome()`, `ClipEditorController.js:389-399`) — this immutable-after-create
  behavior must NOT change.
- `mainframe/shared/clipId.js` — `CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/` and
  `isValidClipId()` additionally **rejects all-digit strings** (`!/^\d+$/.test(clipId)`).
  A naive random 4-char alnum generator **can produce an all-digit result** (e.g. `"8420"`)
  which `isValidClipId` would then reject — the generator must guarantee at least one letter,
  not just uniqueness.
- Server authoritatively rejects collisions on create: `spritesheet.js` `createClipFromFrames`
  throws `Clip "${clipId}" already exists` (`spritesheet.js:234`) if the target directory
  exists. This stays as the final safety net — client-side checks below are a UX nicety, not
  the sole guarantee.
- Client already holds a live list of existing clips: `mainframeState.js` `#clips`
  (`{clipId, meta, hasSprite}[]`), updated via `EVENT_CLIPS_CHANGED`. Use this for client-side
  collision checks instead of a new fetch.

## Requirements
1. **Format**: 4 characters, letters + numbers, must not be all-digit (see `isValidClipId`
   constraint above).
2. **Uniqueness + collision strategy (per user clarification)**: check the candidate against
   `mainframeState.clips` before assigning.
   - On collision, regenerate a new candidate at the same length and re-check.
   - If length 4 is exhausted (repeated collisions suggest the space is full — pick a sane
     retry cap before escalating, e.g. a few dozen attempts), **grow to 5 characters**, then
     6, then 7, etc., open-ended with no hard cap, until a free ID is found.
   - This growth-on-exhaustion behavior applies identically to **both** the random path and
     the name-derived path below.
3. **Name-derived**: when the user has entered a clip name, slug/normalize it
   (lowercase, strip non-alnum) and derive the ID from it (e.g. truncate, or hash down
   to 4 chars) instead of a fully random combo — still collision-checked with the same
   guarantee (regenerate/grow on clash per point 2), still never all-digit.
4. **Live update**: wire the ID field to update as the user types the name or changes other
   relevant inputs, no save required — this is new; today `resetUploadClipId()` only fires
   once per "new clip" reset. Follow the existing `input`/`change` listener wiring pattern
   already used elsewhere in `ClipEditorController.js` (e.g. `updateStagingPreview()`'s
   listeners).
5. **Immutability preserved**: keep existing behavior where the ID becomes read-only after
   first save (`#editingClipId` set) — do not regenerate or allow edits post-save.
6. Existing longer/legacy clip IDs remain valid and untouched — this only changes generation
   for new clips, no migration.

## Suggested Tests
- `generateClipId.test.js`: format (4 chars, alnum), not-all-digit guarantee, uniqueness
  given a set of existing IDs, name-derivation determinism + collision fallback, and
  length-growth to 5/6+ chars when the shorter space is exhausted (e.g. pre-seed all/most
  of the 4-char space in a test and assert the result grows).
- `ClipEditorController` test: typing into the name field updates the visible ID live
  before save; ID field remains read-only and unchanged when editing an existing clip.

## Files
- `mainframe/src/js/generateClipId.js`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/mainframeState.js` (existing-clips source for collision checks)
- `mainframe/shared/clipId.js` (pattern/validation — reference, likely unchanged)
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (ID section, if present)
