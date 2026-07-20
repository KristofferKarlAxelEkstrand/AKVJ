---
type: nit
from: nitpicker
created: 2026-07-20T14:14:17Z
---

# [NIT] server helper + handler naming

Area: `mainframe/server/` — `writeJsonAtomic.js` + `handlers/clips.js` / `routes/router.js`. Monorepo-scripts re-check stayed clean (celebrate `failWithOffenders`, `getTrackedTextFiles`).

- [ ] `mainframe/server/writeJsonAtomic.js` param `data` → `value` (or `jsonValue`)
  - JSDoc `@param {any} data` → matching name
  - **Why:** AGENTS.md prefers domain names over vague `data`; callers pass a serializable value, not an opaque blob.

- [ ] `mainframe/server/handlers/clips.js` export `serveSprite` → `handleGetClipSprite`
  - Update import + call in `mainframe/server/routes/router.js` (~L3, L35)
  - **Why:** every other route handler is `handle*`; this one alone reads like a static-file helper. (Task 362 already covers `spriteData` → `spriteBuffer` in the same function — fold together if convenient.)
