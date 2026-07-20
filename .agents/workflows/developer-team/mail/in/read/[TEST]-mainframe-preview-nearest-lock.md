---
type: test
from: test-marshal
created: 2026-07-20T14:47:02Z
---

# [TEST] PreviewClip / StagingPreview — nearest-always lock

Area: `mainframe/src/js/PreviewClip.js`, `StagingPreview.js`

Human lock (2026-07-20): mainframe preview stays **nearest always**; `scaling: "smooth"` is akvj playback only. Do **not** add tests that expect preview to honor smooth.

Task **365** (validate/spritesheet/HTTP `scaling` plumbing) stays valid and separate.

## Problem

`PreviewClip.test.js` / `StagingPreview.test.js` mock `getContext` with `imageSmoothingEnabled: false` as the *initial* value. That cannot fail if production stops assigning `false` — the mock already looks correct.

## Checklist

- [ ] **`mainframe/test/PreviewClip.test.js`** — tier: **unit**
  - Mock ctx with `imageSmoothingEnabled: true` initially
  - After connect / first paint path (`#render` / `#syncCanvasSize`), assert production set `imageSmoothingEnabled` to `false`
  - Optional: load frames then force a redraw; assert still `false` (PreviewClip `#drawFrame` currently does not re-assign each frame — if that stays true, assert on the setup path only and note the gap)
- [ ] **`mainframe/test/StagingPreview.test.js`** — tier: **unit**
  - Same pattern for main canvas ctx on `#render` and for the offscreen cell ctx used in bake/draw (`imageSmoothingEnabled = false` at ~154 / ~255 / ~327)
  - Assert assignment to `false`, not a pre-seeded mock default

## Explicitly out of scope

- Preview honoring `meta.scaling: "smooth"`
- Editor dropdown for scaling (still optional)
- Ingest soft-resize kernels (`[FEATURE]-ingest-soft-resize-kernels.md`)
