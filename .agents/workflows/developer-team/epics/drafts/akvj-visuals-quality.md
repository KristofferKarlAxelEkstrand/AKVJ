# Epic: AKVJ Visuals Quality (Compositor & ClipLoader)

## Scope

This epic bundles three related findings from the 2026-07-20 `akvj/src/js` human review:

1. **Hot-path GC churn** (`Compositor.js:203-205`): fresh `ImageData` objects allocated every frame despite a comment claiming buffers are reused.
2. **Layer Group B silently dropped** (`Compositor.js:182-188`): when no mask is loaded and both layer groups are active, only Group A reaches the output.
3. **Duplicate image loads** (`ClipLoader.js:355-371`): each velocity slot creates its own `Image` and `Clip`, so a clip mapped across many velocities decodes many times.

## Goal

Make the renderer both correct and efficient: reuse frame buffers, draw both layer groups when no mask is present, and avoid decoding the same sprite sheet multiple times per load pass.

## Status

`drafts/` — waiting on design and human intent for layer blending before implementation tasks are filed.
