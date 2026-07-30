---
status: done
assignee: qa-reviewer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 343: Mainframe atomic JSON writes

## Source

Human review `mail/in/[REVIEW]-mainframe-2026-07-20.md` finding 3

## Description

Every `fs.writeFile` on `key-map.json`, `meta.json`, `active-project.json`, and `projects/index.json` writes in place (17 sites across `mainframe/server/projects.js`, `mainframe/server/handlers/clips.js`, etc.). A crash or two concurrent PUTs can truncate hand-curated mapping data.

Fix: introduce a shared `writeJsonAtomic()` helper (write to temp file + `fs.rename`) and use it for all JSON persistence. Keep it in an appropriate shared module under `mainframe/`.

## Verification

- `npm run lint -w mainframe` passes
- `npm run test -w mainframe` passes (add tests for interrupted writes and concurrency)
- `npm run build -w mainframe` passes
- No remaining `fs.writeFile` calls write JSON directly in the affected modules
