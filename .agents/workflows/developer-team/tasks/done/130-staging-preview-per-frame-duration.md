---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 130: Staging Preview Ignores Per-Frame Duration

## Source
User report: `.agents/workflows/developer-team/inbox/read/bug-editor-preview-ignores-frame-duration.md`

## Problem (root-caused by Team Lead)
`AkvjStagingPreview` (`mainframe/src/js/StagingPreview.js`) plays every frame at a single
global rate, ignoring per-frame durations entirely:

- `loadFrames(files, targetWidth, targetHeight, frameRate, playbackMode, scaleMode)` — only
  accepts one scalar `frameRate` (`StagingPreview.js:55-58`), stored as `#frameRate`.
- `#getFrameInterval()` (`StagingPreview.js:234-236`) computes `fpsToMs(this.#frameRate) / this.#playbackSpeed`
  — the same interval for every frame, always.
- The caller, `ClipEditorController.updateStagingPreview()` (`ClipEditorController.js:451-458`),
  reads a single `#upload-frame-rate` form field and passes it straight through — it never
  passes `this.#stagedDurationsMs` (the per-frame ms array that already exists on the
  controller and IS correctly used elsewhere).

Contrast: the frame list/thumbnail component (`#clipFramesElement`, updated via
`#refreshClipFramesElement` around `ClipEditorController.js:440-448`) already builds
`{ src, duration: this.#stagedDurationsMs[index] ?? 1000 }` per frame — so per-frame duration
data exists and is correctly wired to *that* component already. `StagingPreview` is the one
place that doesn't consume it.

## Fix Direction
- Extend `StagingPreview.loadFrames(...)` (or add a setter) to accept a per-frame duration
  array (ms), mirroring how `#stagedDurationsMs` is already shaped for `#clipFramesElement`.
- Replace the single-`#frameRate` interval in `#getFrameInterval()`/`#animate()` with a
  per-current-frame lookup, still divided by `#playbackSpeed`.
- `ClipEditorController.updateStagingPreview()` should pass `this.#stagedDurationsMs` through
  to the preview instead of (or alongside) the global `upload-frame-rate` field. Decide
  whether the global frame-rate field becomes just the *default* for frames without an
  explicit override, or is removed from this path — check `editorMeta.js` /
  `frameTiming.js` conventions for how ms-vs-FPS is normally reconciled (per
  `spec/feature-edit-clip.md` §2–3) before choosing.
- Preview timing should end up consistent with what's actually written to `frameRatesForFrames`
  on save, so authors can trust the preview.

## Suggested Tests
- `StagingPreview` unit test: load frames with distinct per-frame durations, advance via
  fake/controlled timestamps, assert frame-hold time differs per frame.
- `ClipEditorController` test: verify `updateStagingPreview()` forwards the current staged
  per-frame durations to the preview element.

## Files
- `mainframe/src/js/StagingPreview.js`
- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/editorMeta.js` / `mainframe/src/js/frameTiming.js` (reference for ms↔FPS conventions)
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (§2, §3 — timing spec)
