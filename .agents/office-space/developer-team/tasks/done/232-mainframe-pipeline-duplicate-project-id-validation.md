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

# [NIT] Pipeline duplicates project-id validation already in paths.js

## Affected Files
- `mainframe/scripts/clips/Pipeline.js`
- `mainframe/server/paths.js`

## Description
`Pipeline.js` defines a local `PROJECT_ID_PATTERN` and rejects all-numeric ids in `#listProjectIds`. `mainframe/server/paths.js` already exports `isValidProjectId`, which uses the same `CLIP_ID_PATTERN` and applies the same numeric-id guard. Keeping two copies of the same validation rule risks drift.

## Suggested Fix
Import and reuse `isValidProjectId` from `../server/paths.js` (or from a shared location) in `Pipeline.js`.
