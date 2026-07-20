# [NIT] mainframe/src/js/ magic numbers for durations and dimensions

Area: `mainframe/src/js/` (focused on editor + preview + piano UI components)

A quick sweep turned up several bare numeric defaults that already have named constants elsewhere. Naming them would make the editor/preview defaults readable and keep defaults from drifting.

## Checklist (copy-paste actionable)

- [ ] `mainframe/src/js/ClipEditorController.js` uses bare `1000` as the default per-frame duration in ~10 places (e.g. lines 35, 116, 318, 320, 501, 611, 797).
  - **Why:** `1000` appears to mean "1 second default frame duration" in the editor UI, but it is repeated and mixed with other `1000` arithmetic.
  - **Suggested:** add `const DEFAULT_FRAME_DURATION_MS = 1000` (or import `MS_PER_SECOND` if the intent is exactly 1s) and replace all bare occurrences.

- [ ] `mainframe/src/js/ClipFrame.js` line 13 and `ClipFrames.js` line 32 use `1000` as default duration.
  - **Why:** same editor default as `ClipEditorController`; should share `DEFAULT_FRAME_DURATION_MS`.
  - **Suggested:** replace `1000` with the shared constant.

- [ ] `mainframe/src/js/ClipEditorController.js` uses bare `240` and `135` for default frame width/height in ~8 places (e.g. lines 30-31, 38-39, 271-272, 447-448, 743-744, 833-834).
  - **Why:** `mainframe/shared/clipSchema.js` already exports `DEFAULT_FRAME_WIDTH` and `DEFAULT_FRAME_HEIGHT`.
  - **Suggested:** import `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` from `./clipSchema.js` and replace bare values.

- [ ] `mainframe/src/js/StagingPreview.js` imports `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` from `clipSchema.js` but still uses bare `240` / `135` in defaults (lines 24-25, 72-73) and `setValue` calls (lines 833-834 of `ClipEditorController`? verify `StagingPreview`).
  - **Why:** the constants are imported but unused; using them would keep preview dimensions in sync with the canonical canvas size.
  - **Suggested:** replace `240` / `135` with `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT` wherever they represent the default frame/canvas size.

- [ ] `mainframe/src/js/StagingPreview.js` computes `1000 / DEFAULT_FALLBACK_FPS` inline at lines 362 and 372.
  - **Why:** `mainframe/src/js/PreviewClip.js` already defines `const FALLBACK_MS = 1000 / DEFAULT_FALLBACK_FPS`; this value is duplicated and should be shared.
  - **Suggested:** export `DEFAULT_FALLBACK_FRAME_DURATION_MS` from `frameTiming.js` (or `clipSchema.js`) and use it in `StagingPreview.js` and `PreviewClip.js`.

- [ ] `mainframe/src/js/PianoRoll.js` line 628 hard-codes `velocity: 100`.
  - **Why:** magic preview velocity; a named constant clarifies intent.
  - **Suggested:** add `const DEFAULT_PREVIEW_VELOCITY = 100` (or similar) and use it.

- [ ] `mainframe/src/js/PianoKey.js` line 45 uses `hash % 360` for hue degrees.
  - **Why:** `360` is the degrees in a color circle; the file already uses `VELOCITY_RANGE = 128`, so a matching `HUE_DEGREES = 360` constant keeps style consistent.
  - **Suggested:** add `const HUE_DEGREES = 360` and replace `360` in `hash % 360`.

## Notes

- I did not exhaustively re-read all 40 files; these are the high-signal magic-number / named-constant misses from a grep pass. Other files may be clean; these were the obvious ones.
