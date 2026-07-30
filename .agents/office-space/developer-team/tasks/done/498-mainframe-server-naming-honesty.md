---
status: done
assignee: mainframe-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 498 — mainframe/server naming honesty

From: `[NIT]-mainframe-server-naming-honesty-2026-07-29.md` (nitpicker). Renames + optional on-disk key migration. Skipped items owned by **432** / **472**.

## Checklist

1. `clipCatalog.js:11` — `clipsRootFor` → `resolveProjectClipsRoot` (or `projectClipsRootFor`).
2. `clipCatalog.js:79` — private `readClipMeta(dir)` → `readClipMetaFromDir(dir)` (disambiguate from `frameLoad.js` same name, different signature).
3. `projects.js:160,183` — on-disk `active-project.json` key `project` → `projectId`; keep reading legacy `project` once for migration. API already uses `projectId`.
4. `httpUtils.js:15` — `total` → `totalBytes` (next to `maxBytes`).
5. `frameLoad.js:175-177` — sharp `spriteMeta` → `imageMeta` (same honesty as **472**).
6. `frameLoad.js:89-99` — param `raw` → `frameDurationsMsInput` (or `durationsSource`).
7. `clipFramesBody.js:8` — `decodeFrameDataUrls` → `decodeFrameBase64` (or `decodeFrameImagePayloads`).
8. `handlers/clips.js:212,251` — `targetDir` → `clipDirectory` (or `clipFolder`).

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
