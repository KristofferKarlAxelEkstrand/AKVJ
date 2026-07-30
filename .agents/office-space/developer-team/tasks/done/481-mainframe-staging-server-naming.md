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

# 481 — mainframe staging scale + server name leftovers

From: `mail/in/read/[NIT]-mainframe-staging-server-naming-2026-07-29.md` (nitpicker). Rename / hoist constant / reuse helper only — no behaviour change.

Skip items owned by **431** / **472**.

## Do

1. `mainframe/src/js/stagingPreviewDisplay.js` — bare display scale `2` → `STAGING_PREVIEW_DISPLAY_SCALE = 2` next to `STAGING_PREVIEW_MAX_DISPLAY_WIDTH`.
2. `mainframe/server/handlers/clips.js` — `readMapping` → `readFlatMapping` (returns flat entries from nested key-map).
3. `mainframe/server/handlers/projects.js` — reimplemented ready-clip Set → `readyClipIdSet` from `clipCatalog.js`.
4. `mainframe/server/clipFramesBody.js` — drop dead `frames` from return shape; keep `frameBuffers` only; update JSDoc.
5. `mainframe/src/js/apiClient.js` — `API` → `API_BASE_PATH`.

Optional (include if cheap):

6. `handlers/misc.js` — accept `image` only (or keep `gif` alias, drop vague `data`); document in 400 message.

## Verify

`npm run lint -w mainframe`, `npm run test -w mainframe`.

Scope: **mainframe-developer**.
