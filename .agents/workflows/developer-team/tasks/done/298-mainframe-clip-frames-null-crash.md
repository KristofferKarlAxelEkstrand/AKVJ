---
status: done
assignee: mainframe-developer
priority: high
---

# Task 298: Fix mainframe `clip-frames` null crash after `ClipFramesUploadPanel` integration

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-mainframe-akvjmainframe-clip-frames-null-crash-2026-07-19.md`

## Description

`npm run test -w mainframe` is failing with 17 errors in the UI config run. The root cause is a synchronous `document.getElementById('clip-frames')` call in `ClipEditorController` that now returns `null` because the `<clip-frames>` element is rendered dynamically inside `<clip-frames-upload-panel>`.

## Evidence

```
TypeError: Cannot read properties of null (reading 'loadFrames')
    at ClipEditorController.syncStagedFramesUi (src/js/ClipEditorController.js:552:28)
    at ClipEditorController.clearStagedFrames (src/js/ClipEditorController.js:492:8)
    at ClipEditorController.reset (src/js/ClipEditorController.js:254:8)
    at ClipEditorController.bindEventListeners (src/js/ClipEditorController.js:94:8)
    at AkvjMainframe.connectedCallback (src/js/AkvjMainframe.js:609:14)
```

`test/AkvjMainframe.test.js` shows 16 additional failures (empty `clipList.clips`, `projectChooser.projects`, `mappingTable.mappings`, routing/form failures) because the uncaught exception aborts `AkvjMainframe.connectedCallback` before `loadLibrary` / `loadProjects` / `loadMapping` run.

## Root Cause

1. `mainframe/src/index.html` now uses `<clip-frames-upload-panel id="clip-frames-upload-panel"></clip-frames-upload-panel>` instead of `<clip-frames id="clip-frames"></clip-frames>`.
2. `ClipFramesUploadPanel` creates the inner `<clip-frames id="clip-frames">` element in its `#render()` method, which is called from `connectedCallback`.
3. `ClipEditorController` queries `document.getElementById('clip-frames')` synchronously in its constructor and calls `this.#clipFramesElement.loadFrames([])` during `bindEventListeners()`.
4. In the test environment (and potentially in the browser depending on custom-element upgrade order), `AkvjMainframe.connectedCallback` runs before `ClipFramesUploadPanel.connectedCallback` has rendered the inner `<clip-frames>`, so the element is `null` and the call throws.

## Affected Files

- `mainframe/src/js/ClipEditorController.js` — synchronous `getElementById('clip-frames')` and unguarded `this.#clipFramesElement.loadFrames([])`
- `mainframe/src/js/ClipFramesUploadPanel.js` — renders `<clip-frames>` dynamically
- `mainframe/src/js/AkvjMainframe.js` — bootstraps `ClipEditorController` before ensuring the panel has rendered
- `mainframe/test/AkvjMainframe.test.js` — integration tests now failing
- `mainframe/test/ClipFramesUploadPanel.test.js` — layout test failing because SCSS styles are not applied in jsdom

## Suggested Fix Directions

1. **Decouple the controller from the dynamic element ID**: have `ClipEditorController` accept the `clip-frames` element (or the `clip-frames-upload-panel` element) as a constructor option, or query it lazily the first time it is needed, with a null guard.
2. **Expose a getter on `ClipFramesUploadPanel`** (e.g. `.framesElement`) so the controller can request the child element after the panel has rendered.
3. **Guard `syncStagedFramesUi` / `updateClipFrames` / `clearStagedFrames`** against `this.#clipFramesElement` being `null` until the panel is ready.
4. **Ensure `AkvjMainframe.connectedCallback` waits for `<clip-frames-upload-panel>` to be connected** before constructing `ClipEditorController`, or pass the panel element and let the controller observe/re-query it.
5. For `ClipFramesUploadPanel.test.js`, either apply the SCSS in the test environment or use inline assertions on the DOM structure rather than `getComputedStyle` values that depend on external stylesheets.

## Verification

- `npm run test -w mainframe` passes with 0 failures.
- `npm run lint` passes.
- `npm run build -w mainframe` succeeds.

## Related

- Task 293: `Clip Frames + Upload Area — Unified Panel Layout` (in-progress, mainframe-developer)
