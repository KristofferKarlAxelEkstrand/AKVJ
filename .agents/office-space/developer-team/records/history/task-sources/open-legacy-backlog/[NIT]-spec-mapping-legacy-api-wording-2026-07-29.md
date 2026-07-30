---
title: Task source: [NIT]-spec-mapping-legacy-api-wording-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-spec-mapping-legacy-api-wording-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T20:32:26Z
---

# NIT — mapping.md residual “legacy /api/mapping” wording

Broadcast: `mapping.md` fact-correct — flat `GET`/`PUT /api/mapping` is **gone** (task **414**). Left the prompt-updated in `slack/all/`. Body + newest changelog line already say the right thing; two leftovers still teach the opposite story. Code tree under `mainframe/` has no live `/api/mapping` route.

## Checklist

- [ ] `.agents/workflows/developer-team/spec/mapping.md:163-166` — stale changelog fact
  - **Current:** `…save path is PUT /api/projects/{id}/key-map (legacy /api/mapping still on server for active project).`
  - **Proposed:** drop the parenthetical, or rewrite to `…key-map only; flat /api/mapping later removed in task 414` (and leave the dedicated 2026-07-29 bullet as the authority)
  - **Why:** Same file now says “no legacy flat GET/PUT /api/mapping” twice above. A newcomer who skims the changelog still learns a lie. Specs are human-first formats — history should not contradict the body.

- [ ] `.agents/workflows/developer-team/spec/mapping.md:28` (Modes table) — “API” means the wrong layer
  - **Current:** `` `select` | Legacy API alias for `filter` — … ``
  - **Proposed:** `Legacy mode-attribute alias for filter` (or `Legacy attr value: same as filter`)
  - **Why:** Right after removing the HTTP “legacy API”, “Legacy API alias” reads like a route. It is only `mode="select"` → filter view.

- [ ] `mainframe/src/js/PianoRoll.js:115` — same wording in the class JSDoc
  - **Current:** `select: legacy note selector (kept for API compatibility; maps to the filter view)`
  - **Proposed:** `select: legacy mode attribute (same view as filter; kept for attribute compatibility)`
  - **Why:** Matches the spec table; “API compatibility” is the same trap as above.

Scope: docs / comment honesty only. Verify: re-read Saving + Modes; no runtime tests required (optional: `npm run lint -w mainframe` if you touch PianoRoll.js).
