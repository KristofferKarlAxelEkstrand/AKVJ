---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 125: Extract `ClipEditorController` from `mainframe/src/main.js`

## Severity: Refactor

## Summary
Move the clip editor logic out of the ~1034-line `main.js` into a controller or custom element that owns staging state, hydration, and submit branching.

## Acceptance Criteria
- Extract `ClipEditorController.js` (or `<akvj-clip-editor-panel>` custom element) that owns staging state (`stagedFiles`, `stagedDurationsMs`, `stagedFrameUrls`, `framesDirty`, `loadedFrameWidth`, etc.).
- Move `hydrateClipEditor`, create vs meta-only-PUT vs frames-PUT submit branching into the controller.
- `main.js` becomes router → controller wiring only.
- Retire legacy `<akvj-clip-editor>` component and `ClipList.attachEditForm()`; migrate tests to the shared editor path.
- Verify `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe` pass.

## Notes
- Directly serves `spec/feature-edit-clip.md` (URL-driven hydrate/reset, one editor surface).
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §M3, M4.
