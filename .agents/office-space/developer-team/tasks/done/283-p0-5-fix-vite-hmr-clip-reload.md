---
status: done
assignee: akvj-developer
priority: high
epic: refactor-for-greatness-2
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 283 (P0-5): Fix Vite HMR clip-reload path

Part of `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md`.

## Goal

The Vite reload plugin still watches the old `/public/clips/` path, but the clip pipeline now writes to `/public/projects/{id}/clips/`. Dev server won't auto-reload clip changes.

## Changes

- In `akvj/vite.config.js` (reload plugin), change the reload pattern from `/public/clips/` to `/public/projects/` (or watch both for backwards compatibility during transition).

## Verify

- Edit a clip PNG, run `npm run clips` or `npm run clips:watch`, and confirm the dev server auto-reloads.

## Affected files

- `akvj/vite.config.js`

## Notes

- This is Priority 0; complete after P0-1 lands.
