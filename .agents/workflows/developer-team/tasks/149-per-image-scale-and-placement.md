---
status: backlog
assignee: none
priority: medium
---

# Task 149: Per-Image Scale, Custom Size, and Placement on Import

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-per-image-scale-and-placement.md`
Follow-up (global "set scale for all" + persistence clarification):
`.agents/workflows/developer-team/inbox/read/request-set-scale-for-all.md`

## Do Not Confuse With Tasks 141/142/143 (Clip-Level Placement)
That epic (spec done, akvj/mainframe implementation in progress) is about where the **whole
clip cell** sits on the 240×135 **output canvas at play time** (`meta.json`'s clip-level
`placement: { x, y }`, resolved by the akvj engine in `Clip.js`).

**This task is a different layer entirely**: where each **source image** sits within its own
**frame cell during import/composition**, at **build time**, before the spritesheet is even
built. Confirmed scope — purely mainframe editor + build pipeline, **no akvj engine changes
needed**, because the result gets baked into `sprite.png` pixels once and for all; the akvj
engine never sees individual source images. Use a **different field name** than the clip-level
`placement` to avoid schema collision/confusion (e.g. per-frame data, not clip-level).

## Confirmed Current Limitation
`mainframe/scripts/clips/lib/spritesheet-core.js`:
- `resizeFrames(sharpLib, frameBuffers, targetWidth, targetHeight, scaleMode)` (line 60-62)
  applies **one `scaleMode` to every frame buffer** in the array via `Promise.all(...
  fitFrameBuffer(...))`.
- `fitFrameBuffer()` (line 71-89) handles `stretch`/`fit`/`cover`/`none` — `none` already does
  **centered** placement with crop/pad (`fitNone()`, line 96-130), but with **no offset
  control** — always dead-center, no way to nudge.

This confirms the request's premise: no per-image scale or placement control exists today.

## Settled Decisions (Team Lead)
1. **Custom size unit**: absolute pixel width/height (matches existing `frameWidth`/
   `frameHeight` precedent and the request's own wording "arbitrary width/height"), not a
   scale multiplier.
2. **Schema location**: per-frame, sparse (mirror `frameRatesForFrames`'s sparse
   index-keyed-object pattern, not a dense array — most frames won't need overrides). Proposed
   shape: `frameComposition: { "<index>": { scaleMode, width, height, placement: { x, y } } }`
   in `meta.json`, only entries that deviate from the clip's default `scaleMode`/dimensions
   need to appear.
3. **Placement semantics**: same center-origin convention as the clip-level feature —
   `0,0` = centered within the frame cell, offsets move it from there. Reuse
   `resolveScaleMode`/whole-pixel conventions already established (Task 141) for consistency,
   even though this is a build-time (not runtime) concern.

## Persistence Model — Settled by Follow-Up Request
The follow-up (`request-set-scale-for-all.md`) explicitly settles this: **bake-only**. Scale
and placement choices are **editing-session state**, consumed once when the spritesheet is
composited, and **not** written to `meta.json` — no `frameComposition` field, no sidecar. This
matches how per-frame ms durations already work client-side before save (`#stagedDurationsMs`
in `ClipEditorController.js`) — hold per-image scale/placement as in-memory staged state
alongside the staged files, only consumed by `resizeFrames()`/`fitFrameBuffer()` at
create/save time. Re-editing a clip re-extracts from the already-composited `sprite.png`
(existing behavior, Task 115) — per-image choices from a prior session aren't recoverable,
same as today's single-scaleMode behavior. This simplifies scope: no meta schema/validation
changes needed for this field, no hydrate-path changes for reopening a clip.

## Global "Set Scale for All" (per follow-up request)
Mirror the exact UX pattern already established for frame timing (Task 132's ms "Set all",
Task 144's FPS preset "Apply"):
- One global scale-mode control that applies to **every** staged image at once.
- The moment any **individual** image's scale/size/placement is changed away from the uniform
  value, **disable + blank** the global control (same pattern as
  `ClipFrames.areDurationsUniform()` / `syncGlobalDurationControl()` in
  `ClipEditorController.js`).
- Reset path: re-applying the global control's value restores uniform (same "Apply" pattern).
- Mixed-state display: **blank while disabled** (not last uniform value) — reuse the exact
  precedent already settled for both Task 132 and Task 144, for consistency across all three
  "set all" controls in this editor.

## Requirements
- Editor UI: per-image scale mode selector (existing modes + new **Custom**), custom
  width/height inputs (shown only for Custom), placement X/Y inputs — all per staged image,
  not one shared clip-level control.
- Global "set scale for all" control per the follow-up (see above) — same toolbar area as the
  ms/FPS timing "set all" controls from Tasks 132/144.
- `resizeFrames()`/`fitFrameBuffer()` need a per-frame variant that accepts an array of
  scale/placement configs instead of one shared `scaleMode`.
- Placement offset support in `fitFrameBuffer`/`fitNone` (currently hardcoded to dead-center
  with no offset param).
- Editor preview reflects the composed result live, matching what will actually bake into the
  spritesheet.
- No `meta.json`/validation changes needed — this is bake-only, in-memory editing state (see
  Persistence Model above).

## Suggested Tests
- `spritesheet-core` / `fitFrameBuffer`: custom size + placement offset produces expected
  pixel positioning (existing `optimize-bitDepth.test.js`/spritesheet tests are a good
  reference for sharp-based pixel assertions).
- Mixed per-frame scale modes within one clip round-trip correctly through create/save.
- Editor: per-image controls update independently without affecting other staged frames.
- Global "set all" control: applies to every staged image; disables/blanks on divergence;
  restores uniform on re-apply — mirror `ClipFrames`/`ClipEditorController` test patterns from
  Tasks 132/144.

## Files
- `mainframe/scripts/clips/lib/spritesheet-core.js`
- `mainframe/server/spritesheet.js`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/index.html`
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (§3)
- `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md` (§7 area, per-image vs
  clip-level distinction)
