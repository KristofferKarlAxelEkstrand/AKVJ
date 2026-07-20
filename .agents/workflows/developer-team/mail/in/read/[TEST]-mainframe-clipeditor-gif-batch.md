---
type: test
from: test-marshal
created: 2026-07-20T15:26:43Z
---

# [TEST] ClipEditorController — GIF batch matrix gaps

Area: `mainframe/src/js/ClipEditorController.js` `stageSelectedFiles`  
Woken by `[PROMPT-UPDATED]-clip-editor-goal.md` (left in `slack/all`).

`clip-editor.md` batch table: lone animated GIF expands; lone static GIF = 1 frame; **GIF + other images → no expand, each GIF is first-page-only at ingest**.

`acceptedImageFiles.test.js` already asserts `shouldAttemptGifExpand([gif,png]) === false`. **Controller never tests that path.**

## Checklist

- [ ] **`mainframe/test/ClipEditorController.test.js`** — tier: **unit**
  - **GIF + PNG mix:** stage `[anim.gif, frame.png]` with fetch spy → `/api/expand-gif` **not** called; both files appear in staged UI (`loadFrames` length 2 or equivalent)
  - **Two GIFs:** stage `[a.gif, b.gif]` → expand **not** called; two staged frames (same as mix)
  - Keep existing: lone animated expand, static fall-through, expand API error

## Already covered (skip)

- `shouldAttemptGifExpand` matrix in `acceptedImageFiles.test.js`
- Ingest `page: 0` in `normalizeFrameBuffers` / lanczos3 (`spritesheet-core.test.js`, task 377)
- Preview nearest lock (task 379); gifExpand delay edges (task 386)
- No stale “120 BPM preview” assertions found in tests
