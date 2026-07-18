# Team Update: Per-image scale + custom size + placement on import

## Summary

When importing images into a clip, the user should be able to **set the scale on each image
individually** — not just one scale mode for the whole clip. On top of the existing scale modes,
add a **Custom** option where the user sets an **arbitrary size** the image will be. The goal is
that the user *really* can size each frame the way they want.

Also add **placement**: where the image sits within the frame. Origin **`0x0` is the center** of
the frame (not top-left) — so placement offsets move the image out from the middle.

**Important:** the scale and placement are **burned into the image itself** on save. We render the
image at that size/position into the frame and store the resulting pixels. This info does **not**
need to live in `meta.json` — it's **editing-only** state. What's on disk is just the composed
frame; scale/placement are UI controls that shape those pixels before saving.

## Impact

- Today scale is effectively a single clip-level `scaleMode` (`fit`, etc.). Authors can't size or
  position individual imported images.
- Per-image scale + custom size + center-based placement gives real control over how each frame
  composes onto the 240×135 canvas.
- Keeps `meta.json` clean/human-first — no new per-image transform fields; the transform is already
  applied to the saved frame.

## Action Needed

- **Per-image scale:** each imported image can be scaled individually in the editor.
- **Custom size:** add a Custom scale option where the user enters an arbitrary width/height (or a
  scale factor) that the image becomes.
- **Placement:** let the user position each image within the frame, with **`0x0` = center**;
  offsets move it from the middle (+/- X, +/- Y).
- **Bake on save:** apply the scale + placement into the frame pixels when writing the sprite; do
  **not** persist scale/placement in `meta.json`.

## Notes

- Builds on the frame-size / scale-mode work in `spec/feature-edit-clip.md` (§3) and
  `spec/clip-upload-edit-feature.md` — this extends it from clip-level to **per-image**, but as a
  bake-in transform rather than stored metadata.
- Center-origin placement (`0x0` = middle) should be reflected in the editor preview so what you
  set is what you see (WYSIWYG — the preview equals the baked result).
- Editing trade-off to flag for tasking: because scale/placement aren't stored, re-editing a saved
  clip works from the already-composed frame (you can re-scale/re-place that), not from the original
  pre-transform source. Confirm that's acceptable, or whether raw sources should be kept for
  lossless re-edit (ties into the raw-assets idea in the edit spec).
- Open question: is custom size an absolute px size or a scale multiplier? (UI-only either way.)
