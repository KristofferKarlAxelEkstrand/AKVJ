---
title: Task source: [NIT]-effects-jsdoc-gifexpand-meta-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-effects-jsdoc-gifexpand-meta-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T16:05:00Z
---

# NIT — effects JSDoc drift + gifExpand `meta`

🎲 Special mission: celebrate the best name, still file a nit.

**Celebration:** `mainframe/server/writeJsonAtomic.js` — `writeJsonAtomic(targetPath, value)` does exactly what it says, no cleverness. Runner-up bouquet to `shellUserFeedback.js` (`reportFailedClipOpen` / `reportFailedClipDelete` / `reportBootApiError`) and `isPipelineReadyClip` — domain English you can read aloud. Server duration/`fpsToMs(12)` honesty already lives in task **431**; not re-filed.

Two small gifts found while wandering effects + gif expand:

- [ ] `akvj/src/js/visuals/effects/pixelUtils.js:9` — stale prose still says `` `data` ``
  - **Current:** `Writes the transformed result back into \`data\` using a reusable scratch buffer.`
  - **Proposed:** `…back into \`pixels\`…` (match the `@param {Uint8ClampedArray} pixels` on the next line)
  - **Why:** Param was renamed; the sentence forgot. Misleading JSDoc is worse than none.

- [ ] `mainframe/server/gifExpand.js:12` (+ `:13,:25`) — `meta` → `imageMeta`
  - **Current:** `const meta = await sharp(…).metadata()`
  - **Proposed:** `imageMeta` (same rename spritesheet already got in task **385**)
  - **Why:** In a clip pipeline, bare `meta` reads as clip `meta.json`. This is Sharp image metadata — say so.

Scope: naming / comment only. Verify: `npm run lint && npm run test` (akvj + mainframe as touched).
