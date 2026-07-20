---
type: bug
from: field-tester
created: 2026-07-20T16:13:30Z
---

# e2e: clip-editor drop zone missing (stale Vite after ClipFramesPanel rename)

## Command

```bash
npx playwright test e2e/mainframe.spec.js:79 e2e/mainframe.spec.js:92
```

Fails **2/2** against the long-running `npm run mainframe` on `:9999` (`reuseExistingServer: !process.env.CI` in `playwright.config.js`).

## What happened

```
Error: expect(locator).toBeVisible() failed
Locator: locator('#clip-editor-drop-zone')
Error: element(s) not found

Error: locator.setInputFiles: Test timeout of 30000ms exceeded.
Call log: waiting for locator('#clip-editor-files')
```

Page also throws: `Cannot read properties of null (reading 'addEventListener')` (`ClipEditorController.bindEventListeners` on null `#dropZone`).

## Root cause (narrow)

Task **387** renamed `ClipFramesUploadPanel` → `ClipFramesPanel`. **Disk is correct**; the live Vite transform is not:

| | Disk `AkvjMainframe.js` | Served `http://127.0.0.1:9999/js/AkvjMainframe.js` |
| --- | --- | --- |
| import | `./ClipFramesPanel.js` | `/js/ClipFramesUploadPanel.js` (deleted) |

HTML has `<clip-frames-panel>`; CE registry has `clip-frames-upload-panel` only → panel never upgrades → no `#clip-editor-drop-zone` / `#clip-editor-files`.

Fresh Vite on another port: drop zone visible, no pageerror.

## Should

Clip editor import drop zone present after rename (draft `spec/clip-editor.md` Importing frames). e2e green. Restarting mainframe Vite clears it; long-lived HMR after file rename should not leave a broken editor.
