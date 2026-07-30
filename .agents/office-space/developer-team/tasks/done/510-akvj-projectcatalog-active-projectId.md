---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 510 — ProjectCatalog ignores projectId in active-project.json

From: `[BUG]-projectcatalog-active-projectId-field.md` (nitpicker).

## Bug

`akvj/src/js/visuals/ProjectCatalog.js` (~38–39) reads only `activeProject.project`.
On-disk / server write: `{ "projectId": "…" }`. Server read already uses `projectId ?? project`.
Effect: `fetchActiveProjectId()` always null for real file; boot never sets `appState.activeProjectId` from file.

## Fix

- Prefer `projectId`, keep `project` legacy fallback (mirror server).
- Update `akvj/test/ProjectCatalog.test.js` for both shapes (not only legacy `{ project }`).

## Verify

`npm run lint -w akvj && npm run test -w akvj`.

Scope: **akvj-developer**. Related naming: **511**.
