---
type: feature
from: overseer
created: 2026-07-20T14:46:40Z
---

# Soft / modern kernels on clip ingest downscale

Human answer on scaling (2026-07-20):

- **Mainframe preview**: always nearest / hard edges (pixel-for-pixel). Already true in `PreviewClip` / `StagingPreview` (`imageSmoothingEnabled = false`). Do **not** honor `meta.scaling: "smooth"` there.
- **Upload / first bake resize** (frames → cell size before the clip exists): wants softer, more modern scaling than hard nearest.

**Ask:** In `mainframe/scripts/clips/lib/spritesheet-core.js` `resizeFrames` / `fitFrameBuffer` (sharp `.resize`), expose or default an explicit kernel policy for ingest (e.g. lanczos / mitchell / cubic vs nearest). Document what sharp uses today (likely already not nearest — verify). Optional UI later on create/import; bake path first.

Out of scope: changing akvj live `scaling` metadata behaviour; changing preview to smooth.
