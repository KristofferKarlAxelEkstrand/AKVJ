---
status: done
assignee: utility-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 446 — e2e: Projects tab / ProjectChooser live wiring

From: `[TEST]-e2e-projects-tab-coverage.md` (test-marshal).

Library / editor / mapping have Playwright coverage; **Projects does not**. Unit + API cover `project-chooser` / `#panel-projects`; no e2e/visual opens the Projects tab or hits live `/api/projects` from the UI.

## Checklist

Tier: **e2e** (`e2e/mainframe.spec.js`). Prefer `/projects` route or `[data-tab="projects"]` click.

1. [x] **Mount** — `#panel-projects` visible; `#project-chooser` attached; `.project-chooser-select` has ≥1 option (default project present).
2. [x] **Active indicator** — `.project-chooser-active-id` non-empty after load (API-fed).
3. [x] **Tab navigation** — Library ↔ Projects ↔ Settings round-trip; assert panel visibility/`hidden`.
4. [x] **Activate (optional)** — if ≥2 projects (or create one): change select → `#projects-status` success / active id updates; clean up created project.
5. [x] **Org** — delete empty `akvj/test/smoke/` or restore a thin akvj-only smoke; do not leave a misleading empty folder.

Out of scope: Projects API error paths (task **442**); deep rename/delete (unit-covered).

## Verify

`npm run test:e2e` (or targeted Playwright), `npm run lint`.

Scope: e2e + smoke layout — **utility-developer**.
