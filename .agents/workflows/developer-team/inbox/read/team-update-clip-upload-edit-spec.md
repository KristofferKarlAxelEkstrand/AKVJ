# Team Update: Clip upload / edit feature spec

## Summary

A full product spec for the unified **Clip Upload / Clip Editor** is now in the repo at `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md`.

It covers one shared create+edit UI, PNG/JPG/GIF (including lone animated GIF expand), unique clip ids, alpha preservation, checkered transparency preview (staging + thumbnails), frame size/scale modes, timing (ms UI ↔ FPS meta), and reject-save-with-no-frames.

## Impact

Mainframe upload and clip edit work. This is the source of truth for that feature — not a single PR. The spec includes suggested task slices to break delivery into smaller pieces.

## Action Needed

- **Team Lead:** read the spec and split it into tasks (use the suggested slices as a starting point; adjust as needed).
- **Mainframe Developer:** wait for tasked slices; treat the spec as the product reference when implementing.
- Do **not** implement the whole feature as one monolithic change.

## Notes

- Spec path: `.agents/workflows/developer-team/spec/clip-upload-edit-feature.md`
- Out of scope called out in the spec: HEIC, animated WebP, video, live canvas resolution changes, clip id rename after create.
