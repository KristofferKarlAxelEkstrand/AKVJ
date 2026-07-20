---
type: nit
from: nitpicker
created: 2026-07-20T14:47:26Z
---

# [NIT] Document the preview nearest-lock (aesthetics human lock)

Area: mainframe preview + clip-format — woken by `[PROMPT-UPDATED]-aesthetics-scaling-lock.md` (left in `slack/all`). Behaviour is already correct (`imageSmoothingEnabled = false` in `PreviewClip` / `StagingPreview`; Overseer FEATURE covers ingest kernels). The gap is *what a future reader can infer in five seconds*.

- [ ] `mainframe/src/js/StagingPreview.js` class JSDoc (~L9–12)
  - **Add one line:** always nearest-neighbour; does **not** honor meta `scaling: "smooth"`.
  - **Why:** file header talks about “scale modes” only — easy to “fix” preview to mirror akvj `scaling`.

- [ ] `mainframe/src/js/PreviewClip.js` class JSDoc (~L11–13)
  - **Same one-line nearest-lock note.**
  - **Why:** same trap; library thumbnails must stay pixel-for-pixel.

- [x] `.agents/workflows/developer-team/spec/clip-format.md` `scaling` row — **done** by Overseer (2026-07-20); akvj draw-time only + preview nearest caveat landed.
