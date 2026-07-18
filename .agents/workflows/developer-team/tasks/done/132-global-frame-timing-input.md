---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 132: Global "Set All Frames" Timing Input

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-global-frame-timing-input.md`

## Pairs With
Task 130 (done, in QA) made the staging preview honor per-frame duration. This task adds the
authoring-side convenience: a single control to set all frames uniformly, without losing the
ability to override individual frames.

## Current State
- Per-frame duration lives on `ClipFrame` (`mainframe/src/js/ClipFrame.js:11,56-68`) — a
  `type="number"` ms input per frame, firing `durationchange` with
  `{ frameIndex, duration }`, relayed upward through `ClipFrames`
  (`mainframe/src/js/ClipFrames.js:124-125`) which maintains `#frameData[i].duration` and
  exposes `getDurations()` (`ClipFrames.js:51-52`).
- `ClipEditorController` owns `#stagedDurationsMs` and rebuilds `#clipFramesElement` via
  `#refreshClipFramesElement` (`ClipEditorController.js:440-448`), and now (post Task 130)
  also refreshes the staging preview on `durationchange`.
- The existing `#upload-frame-rate` input (`mainframe/src/index.html:96`) is a **different**
  concept — an FPS-based fallback/default (see Task 130's report), not a "write this ms value
  into every frame" control. Do not conflate the two; this task is a new explicit "apply to
  all frames" action, most naturally placed near the `<clip-frames>` element
  (`mainframe/src/index.html:38-48`).

## Requirements
1. Add a global ms timing input (near the frame list) that, when set, writes that duration
   into **every** frame — likely a new `ClipFrames` method (e.g. `setAllDurations(ms)`) that
   updates each `ClipFrame` and re-dispatches so `ClipEditorController`'s
   `#stagedDurationsMs` / staging preview stay in sync.
2. **Grey out (disable)** the global input as soon as any individual frame's duration is
   changed away from the uniform value — i.e. whenever `getDurations()` is not all-equal,
   disable the global control. Recompute this on every `durationchange`.
3. Define + implement the reset path back to uniform (e.g. re-applying the global input's
   value is itself how you get back to uniform — document whichever path is chosen).
4. **Decide and document** what the global input displays while disabled/mixed: blank, or the
   last applied uniform value (open question from the user's report — pick one, note the
   choice in the report).
5. Timing stays in ms in the UI; conversion to `frameRatesForFrames` (FPS) on disk is
   unchanged (`frameTiming.js`, `feature-edit-clip.md` §2–3).

## Suggested Tests
- `ClipFrames` test: `setAllDurations(ms)` applies to every frame and returns durations
  matching from `getDurations()`.
- Disable/enable logic: uniform durations → global input enabled; edit one frame → disabled;
  re-apply global value → enabled again (per chosen reset path).

## Files
- `mainframe/src/js/ClipFrames.js`
- `mainframe/src/js/ClipFrame.js`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/index.html` (new input markup)
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (§2–3, timing conventions)
