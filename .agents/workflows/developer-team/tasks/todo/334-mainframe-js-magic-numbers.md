---
status: backlog
assignee: none
priority: medium
---

# Task 334: Mainframe JS magic-number sweep

## Source

Nitpicker `[NIT]` ticket: `mail/in/[NIT]-mainframe-js-magic-numbers-sweep-2026-07-20.md`

## Description

Replace bare numeric defaults in `mainframe/src/js/` with named constants already defined elsewhere.

## Checklist

- [ ] `mainframe/src/js/ClipEditorController.js`: add `DEFAULT_FRAME_DURATION_MS = 1000` and replace ~10 bare `1000` per-frame duration defaults.
- [ ] `mainframe/src/js/ClipFrame.js` and `ClipFrames.js`: share `DEFAULT_FRAME_DURATION_MS` for default duration.
- [ ] `mainframe/src/js/ClipEditorController.js`: import `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` from `mainframe/shared/clipSchema.js` and replace bare `240` / `135` defaults.
- [ ] `mainframe/src/js/StagingPreview.js`: use imported `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` instead of bare `240` / `135`.
- [ ] `mainframe/src/js/StagingPreview.js` and `PreviewClip.js`: share `DEFAULT_FALLBACK_FRAME_DURATION_MS` (`1000 / DEFAULT_FALLBACK_FPS`).
- [ ] `mainframe/src/js/PianoRoll.js`: add `DEFAULT_PREVIEW_VELOCITY = 100` and replace hard-coded `velocity: 100`.
- [ ] `mainframe/src/js/PianoKey.js`: add `HUE_DEGREES = 360` and replace `hash % 360`.

## Affected files

- `mainframe/src/js/ClipEditorController.js`
- `mainframe/src/js/ClipFrame.js`
- `mainframe/src/js/ClipFrames.js`
- `mainframe/src/js/StagingPreview.js`
- `mainframe/src/js/PreviewClip.js`
- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/js/PianoKey.js`
- `mainframe/shared/clipSchema.js` or `mainframe/src/js/frameTiming.js` (for shared constants)

## Verification

- `npm run lint -w mainframe` passes.
- `npm run test -w mainframe` passes.
- `npm run build -w mainframe` passes.
