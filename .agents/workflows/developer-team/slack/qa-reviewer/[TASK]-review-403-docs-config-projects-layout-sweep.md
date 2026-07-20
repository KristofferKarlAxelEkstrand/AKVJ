---
type: report
from: utility-developer
to: team-lead
task: 403
created: 2026-07-20T17:10:00Z
---

# 403 — Docs & config sweep for the projects layout

Docs and config now describe the per-project clip layout; dead script/link references removed.

- `README.md` — dropped `npm run migrate:clips` (no such script); fixed broken `clips/LICENSE-ASSETS.md` link → `projects/default/LICENSE-ASSETS.md`.
- `CONTRIBUTING.md` — "Adding Clips" now uses `projects/{projectId}/clips/{clipId}/` and the real nested `key-map.json` shape (was a flat array of objects, which the loader never accepted).
- `docs/how-to-program-midi.md` — channel 14 is project selection in both channel lists + new "Project selection" section; all `clips/{clipId}` / `clips/key-map.json` paths → project paths; `clips/{ch-1}/{note}/{vel}/` troubleshooting step rewritten; `../clips/README.md` link fixed.
- `projects/default/README.md` — retitled "Project: default", directory tree rooted at `projects/default/`, scaffold/manual paths qualified.
- `package.json` — `name` → `akvj-monorepo`.
- `mainframe/package.json` — dropped duplicate `clips`, `clips:clean`, `clips:new`, `clips:spritesheet`, `clips:validate`. **Kept `clips:watch`** — `dev` invokes it and `mainframe/test/smoke/startup.smoke.js:47` pkills on that literal string.
- `mainframe/scripts/clips/lib/validate/index.js` — error text no longer points at the removed `migrate:clips`.

Already done before I started, no change needed: AGENTS.md Security & Boundaries + Troubleshooting paths (item 2), midi-mcp in `knip.json` / `eslint.config.js` / AGENTS.md (item 5), Husky/lint-staged claims (item 6 — all three docs already describe `.githooks/`). Vite is already `^8.1.5` in both workspaces, so no alignment and **no npm-request** needed.

Verified: `npm run lint` clean, `npm run test` 585 passed, `npm run test -w mainframe` 813 passed, `npm run build` OK, `npx prettier --check` clean on every touched file, and the stale-reference grep returns nothing outside `.agents/` history.

One caveat: the first `npm run test -w mainframe` run failed on one assertion (`data.meta.playback` → `pingpong`); it passed on a clean rerun with no code change in between. Likely shared-tree contention with 400/401. Flagging rather than calling it green silently.

Files left uncommitted in the working tree as usual. `AKVJ_HUMAN=1` → `HUMAN=1` in `AGENTS.md`/`CONTRIBUTING.md` is someone else's concurrent edit, not mine.
