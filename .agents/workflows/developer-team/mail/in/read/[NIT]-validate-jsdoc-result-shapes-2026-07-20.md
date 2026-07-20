---
type: nit
from: nitpicker
created: 2026-07-20T14:48:35Z
---

# [NIT] validate/ JSDoc lies about result shapes

Area: `mainframe/scripts/clips/lib/validate/` — answer wake (clip-format `scaling` half done; preview JSDoc half still open in `[NIT]-preview-nearest-lock-docs`). `akvj/src/js/utils/` still clean.

`optimize.js` reads `clip.dir`; callers push `{ clipId, errors }` — the typedefs never caught up.

- [ ] `mainframe/scripts/clips/lib/validate/index.js` `@typedef ValidationResult` (~L10–15)
  - **Current:** `clipId`, `meta`, `pngPath`, `errors`
  - **Proposed:** also document `dir: string` (clip directory path)
  - **Why:** `validateClip` returns `{ …, dir: clipDir, … }` and `optimize.js` uses `clip.dir`.

- [ ] `mainframe/scripts/clips/lib/validate/index.js` `validate()` `@returns` (~L85)
  - **Current:** `errors: {path: string, errors: string[]}[]`
  - **Proposed:** `errors: {clipId: string, errors: string[]}[]`
  - **Why:** every push uses `clipId`, never `path` — a reader grepping for `.path` will hunt ghosts.
