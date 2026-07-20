---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 278: e2e clip editor: stale FPS-preset selector + dead unit test

## Description

The e2e clip editor and its unit fixture reference the removed `#clip-frames-fps-preset` control. Update the tests to match the new ms/Sync timing UI and clean up the dead fixture/test.

## Findings

1. **Stale e2e selector**  
   `e2e/mainframe.spec.js:69` expects `#clip-frames-fps-preset` to have value `12`, but the actual page no longer contains that element. It now uses `#clip-frames-global-duration` (default `1000`) and `#clip-editor-sync` (default `free` / `beat`).

2. **Dead unit test + phantom DOM**  
   `mainframe/test/ClipEditorController.test.js` still renders `#clip-frames-fps-preset` and `#clip-frames-apply-fps-preset` in its fixture, while `ClipEditorController.js` no longer queries those IDs. The test `FPS preset applies the same ms as Set all (1000/fps) and disables when mixed` is reduced to `expect(true).toBe(true)`.

3. **Missing coverage for new timing UI**  
   No e2e or unit test verifies the new ms/Sync controls (default ms, Sync default, Set-all duration wiring).

## Suggested work

- Update `e2e/mainframe.spec.js:61-69` to assert the new timing controls:
  - `#clip-frames-global-duration` defaults to `1000`
  - `#clip-editor-sync` defaults to `free`
  - (optional) after staging frames, clicking `#clip-frames-set-all-duration` updates per-frame ms values.
- Remove `#clip-frames-fps-preset` / `#clip-frames-apply-fps-preset` from `mainframe/test/ClipEditorController.test.js` fixture.
- Delete or rewrite the vacuous `expect(true).toBe(true)` test. If FPS→ms conversion is still needed in `ClipFrames`/`frameTiming`, test the real function; otherwise remove.

## Affected files

- `e2e/mainframe.spec.js`
- `mainframe/test/ClipEditorController.test.js`
- `mainframe/src/js/ClipEditorController.js` (read-only unless a real bug is exposed)

## Verification

1. `npm run lint` passes.
2. `npm run test -w mainframe` passes.
3. `npx playwright test e2e/mainframe.spec.js` (or `npm run test:e2e` if defined) passes.

## Notes

- No runtime behavior changes unless a real bug is found; this is test/fixture cleanup.
