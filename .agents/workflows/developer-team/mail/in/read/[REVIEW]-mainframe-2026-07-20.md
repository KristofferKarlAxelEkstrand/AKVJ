---
type: review
from: human
created: 2026-07-20T07:07:41.457Z
---

# Team Update: mainframe/ review

Reviewed `mainframe/` server + src (~24k lines incl. tests). Baseline: `vitest run --config vitest.config.js` green (46 files / 534 tests), eslint clean. Five findings, worst first.

1. **Deleting a mapped clip bricks mapping saves** — `server/handlers/clips.js:268-285` removes the clip dir but never prunes `key-map.json`; the client (`src/js/AkvjMainframe.js:290`) only reloads the library. The stale slot survives, and every later `PUT /api/mapping` throws at `mappingService.js:89` (`clipId "x" is missing or incomplete`) until someone hand-edits the file. Fix: prune matching slots on delete (or warn + offer).
2. **`PUT /api/clips/:clipId` writes unvalidated meta values** — `handlers/clips.js:342-357` whitelists 21 keys but type-checks only `png`. `{"frames":"banana"}` returns 200 and lands in `meta.json`, then breaks `npm run clips` and silently drops the clip in AKVJ's ClipLoader. Tests at `test/server.test.js:576` cover key filtering, never value shape. Reuse the pipeline's `scripts/clips/lib/validate/meta.js`.
3. **Non-atomic JSON writes** — every `fs.writeFile` on `key-map.json`, `meta.json`, `active-project.json`, `projects/index.json` (17 sites; `projects.js:63,181,218,254,267`, `handlers/clips.js:43,357`) writes in place. A crash or two concurrent PUTs truncates hand-curated mapping data. Fix: shared `writeJsonAtomic()` (tmp + `fs.rename`).
4. **18 files fail `prettier --check`** — incl. `server/handlers/clips.js`, `server/routes/router.js`, `src/js/ClipEditorController.js`, `src/scss/PageShell.scss`. CI runs `prettier --check .` (84 files repo-wide, so `test-results/` also wants gitignoring). Fix: `npm run format:prettier`.
5. **Oversized body → 500, not 413** — `server/httpUtils.js:11-27` rejects past 32 MiB and destroys the socket; the router's catch-all (`server/index.js:29`) turns it into a generic 500 on an already-destroyed response. Map it to 413 before the socket dies.

Action: 1 and 2 are user-visible data bugs — worth tasks now. 3 is a data-loss class fix. 4 is a one-liner.
