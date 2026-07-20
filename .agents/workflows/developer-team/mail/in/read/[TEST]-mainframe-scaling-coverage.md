---
type: test
from: test-marshal
created: 2026-07-20T14:07:46Z
---

# [TEST] mainframe — `scaling` metadata plumbing coverage

Area: `mainframe` server / validate / spritesheet (post Task 294)

Runtime (akvj `Clip` / `clipMetadata`) and `editorMeta` helpers are covered. The write/validate path that persists `scaling` into `meta.json` is not.

## Checklist

- [ ] **`mainframe/scripts/clips/lib/validate/meta.js`** — unit (`validate-extended.test.js` or sibling)
  - Accept `scaling: "nearest"` and `scaling: "smooth"`
  - Reject invalid values (e.g. `"bilinear"`) with `scaling must be one of…`
  - Omit field → still valid (optional)
- [ ] **`mainframe/server/spritesheet.js` `resolveScaling` / `buildClipMeta`** — unit (`spritesheet.test.js` or create/update helper test)
  - `scaling: "smooth"` written into `meta.json`
  - Invalid / omitted → defaults to `"nearest"` (or field omitted per current `if (clipOptions.scaling !== undefined)` behaviour — assert actual contract)
- [ ] **`mainframe/server/handlers/clips.js`** — HTTP (`server.test.js`)
  - POST create with `scaling: "smooth"` → GET/meta shows smooth
  - PUT meta with `scaling: "smooth"` round-trips
  - Recompile without body `scaling` keeps existing meta value (lines 249–254)
- [ ] **`mainframe/server/clipFramesBody.js`** — unit if not covered by handler tests: `scaling` passthrough in parsed body

Tier: **unit** (jsdom/node Vitest for mainframe). No visual/e2e needed for this batch.

## Already covered (do not re-do)

- `akvj/test/Clip.test.js` nearest/smooth `imageSmoothingEnabled`
- `akvj/test/clipMetadata.test.js` normalize + invalid fallback
- `mainframe/test/editorMeta.test.js` `metaPatchFromEditor` / defaults
