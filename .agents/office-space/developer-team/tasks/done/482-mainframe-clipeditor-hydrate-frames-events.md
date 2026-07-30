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

# 482 — ClipEditorController hydrate edges + clip-frames event wiring

From: `mail/in/read/[TEST]-mainframe-clipeditor-hydrate-and-frames-events.md` (test-marshal). Tests only — no product source changes.

Extend `mainframe/test/ClipEditorController.test.js` (DOM fixture + fetch mock).

## Hydrate edge paths

1. **Invalid clipId** — `hydrate('../evil')` → `messages.error`, form reset to new-clip chrome, no frames fetch.
2. **Empty frames payload** — `GET /clips/:id/frames` → `{ frames: [] }` → error `/has no editable frames/i`, editor resets.
3. **Optional:** empty/null-ish hydrate (`action: 'new'`) only resets, no error.

## `#attachClipFramesListeners` (after bind + staged files)

4. **`framesreordered`** — 2+ staged files; reverse indices; assert order + `#framesDirty`.
5. **`frameremove`** — stage 3, remove middle; remaining arrays stay aligned; dirty set.
6. **`framescleared`** — staged empty / same as `clearStagedFrames`.

## Rejected file staging

7. **All rejected** — `.webp` only → error, no staged frames.
8. **Mixed** — PNG + unsupported → warn + only PNG staged.

## Out of scope

- Task **479** frameLoad / frameDurationsMs.
- GIF batch, bake scale, pianoRollMappingEdit, shellUserFeedback (already covered).
- Pure `acceptedImageFiles` partition helpers.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
