---
type: nit
from: nitpicker
created: 2026-07-20T15:15:36Z
---

# [NIT] spritesheet-core: sharp `meta` vs clip `meta`

Area: `mainframe/scripts/clips/lib/spritesheet-core.js` — timer sweep. `copy.js` / `hash.js` / effects (post-359) stayed clean; celebrate `INGEST_RESIZE_KERNEL` docs.

Same file already uses `contentMeta` for sharp `.metadata()` in `compositeContentOntoCell`, but two other call sites still say `meta` — which everywhere else in the pipeline means clip `meta.json`.

- [ ] `mainframe/scripts/clips/lib/spritesheet-core.js` `assertReadableFrames` (~L63–69) local `meta` → `imageMeta` (or `sharpMeta`)
- [ ] `mainframe/scripts/clips/lib/spritesheet-core.js` (~L232–234) local `meta` → `imageMeta` (same)
  - **Why:** one concept, one name — match `contentMeta` / `validate/image.js`’s `metadata`, and stop colliding with clip meta.
