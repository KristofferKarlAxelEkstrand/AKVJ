---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 137: Clip Timing & Sync — Slice 2: Editor UI (Sync Toggle, Length Presets, Live Preview)

## Depends On
Task 136 (schema + normalize) must be done first — this slice consumes its field names
(`sync`/`syncLength`/`syncBeats`/`beatsPerBar`) and shared preset constants
(`mainframe/shared/clipSchema.js`). Check Task 136's report for any naming adjustments made
during implementation before starting.

## Source
Spec: `.agents/workflows/developer-team/spec/feature-clip-timing-and-sync.md` (§ User flows
1–3, § Suggested slicing #2)

## Goal
Add editor UI for the new sync fields to `ClipEditorController.js`. Note: Task 144 (done,
in QA) **removed** the old standalone `#upload-frame-rate` field — the current toolbar next
to `<clip-frames>` is Task 132's ms "Set all" input/button plus Task 144's FPS-preset
"Apply FPS" select/button (`fpsToMs(fps)` → `setAllDurations`). Build the sync controls as a
new addition alongside these, not referencing the now-removed frame-rate field:
- Sync mode toggle: **Free** / **Beat synced**.
- When Beat synced: length preset dropdown (the shared preset list from Task 136 —
  `SYNC_LENGTH_PRESETS` in `clipSchema.js`) + custom beats input (shown only for
  `syncLength: "custom"`) + beats-per-bar input (default 4, `DEFAULT_BEATS_PER_BAR`).
- **Live preview**: `StagingPreview` (Task 130) must reflect the recalculated
  `frameDurationBeats` timing as the author adjusts sync settings — this pairs directly with
  Task 130's per-frame-duration preview fix. Since expansion lives in akvj's
  `clipMetadata.js` (Task 136's `resolveFrameDurationBeats()`/`expandSyncToFrameDurationBeats()`
  — see its report), mainframe needs its **own** mirrored copy of the same expansion math for
  the live preview (no cross-realm import — same precedent as `clipSchema.js` mirroring
  `clipMetadata.js`). Keep it small and clearly labeled as a mirror.

## Suggested Tests
- `ClipEditorController` test: toggling sync mode shows/hides the right fields; changing
  length preset or beats-per-bar updates the live preview timing.
- Mirrored expansion helper: same test cases as Task 136's akvj-side tests, to confirm
  parity between the two copies.

## Files
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/index.html` (new sync controls markup)
- New: mainframe-side mirrored expansion helper (naming TBD by Task 136's actual akvj
  function name)
- `mainframe/src/js/StagingPreview.js` (consumes recalculated durations — already accepts
  per-frame ms array per Task 130)
