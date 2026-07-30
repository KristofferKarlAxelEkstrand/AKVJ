---
status: done
assignee: mainframe-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 431 — mainframe/server project-id honesty + duration units

From: `[NIT]-mainframe-server-project-id-unit-honesty-2026-07-20f.md` (nitpicker).

Swept `mainframe/server/` (handlers, routes, frameLoad, gifExpand, clipCatalog, paths, writeJsonAtomic).

## Checklist

1. **`project` wire key means two types** — ID-only responses (`GET /api/projects/active`, activate) use `{ project: "<id>" }` while GET/POST/PUT project return `{ project: { id, name, … } }`. Rename ID-only responses to `{ projectId: "<id>" }` (match client `activeProjectId`). Call sites: `AkvjMainframe.js:511,554,556`; `mainframe/test/server.test.js:750,772,775,780`. Keep on-disk `active-project.json` `{ project }` unless aligning that too (`ProjectCatalog.js` reads the file key).
2. **Drop `activeProjectId()` alias** in `clipCatalog.js:10` — call `getActiveProjectId()` directly. Call sites: `clipCatalog.js:19,62`; `handlers/clips.js` (8×).
3. **Bare `12` FPS fallback** — `frameLoad.js:104` `fpsToMs(12)`; `gifExpand.js:21,31` → `fpsToMs(DEFAULT_FALLBACK_FPS)` from `../shared/frameTiming.js`.
4. **`frameLoad.js` duration helpers missing `Ms`** — `durationsFromMeta` → `durationsMsFromMeta`, `padDurations` → `padDurationsMs` (both return millisecond arrays).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`, `npm run build`.
