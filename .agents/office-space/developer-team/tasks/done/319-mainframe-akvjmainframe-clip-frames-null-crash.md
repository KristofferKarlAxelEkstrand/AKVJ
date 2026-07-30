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

# Task 319: Mainframe `AkvjMainframe` crashes when `clip-frames` element is not yet rendered

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-mainframe-akvjmainframe-clip-frames-null-crash-2026-07-19.md`

## Description

`AkvjMainframe.connectedCallback` was throwing because `ClipEditorController` synchronously queried `document.getElementById('clip-frames')` and called `loadFrames` on it before `ClipFramesUploadPanel` had rendered its inner `<clip-frames>` element.

## Findings and actions

### 1. Decouple `ClipEditorController` from the dynamic element

**File:** `mainframe/src/js/ClipEditorController.js`

- Replaced the synchronous `#clipFramesElement` field assignment with a private getter that resolves `document.getElementById('clip-frames')` on demand.
- Moved the `<clip-frames>` event listener wiring into a new `#attachClipFramesListeners()` method that is called lazily once the element exists.
- Guarded `syncStagedFramesUi`, `updateClipFrames`, and `submit` against a missing `<clip-frames>` element.
- Made the `clip-frames-clear` click handler and `clipListElement` `clipedit` listener safe with optional chaining.

### 2. Expose inner `clip-frames` via `ClipFramesUploadPanel`

**File:** `mainframe/src/js/ClipFramesUploadPanel.js`

- Added a public `clipFramesElement` getter that returns `this.querySelector('clip-frames#clip-frames')`, giving future consumers a direct, race-free way to access the inner element.

### 3. Defer `ClipEditorController` construction until the panel is ready

**File:** `mainframe/src/js/AkvjMainframe.js`

- Wrapped `ClipEditorController` construction and `bindEventListeners()` in `queueMicrotask()` so `ClipFramesUploadPanel.connectedCallback` (and its inner `<clip-frames>` render) runs first.

## Affected files

- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/ClipFramesUploadPanel.js`
- `mainframe/src/js/AkvjMainframe.js`

## Verification

- `npm run lint` (root) — passed
- `npm run lint -w mainframe` — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run build -w mainframe` — passed

## Notes

- No runtime behavior changes; this is a lifecycle / null-safety fix.
