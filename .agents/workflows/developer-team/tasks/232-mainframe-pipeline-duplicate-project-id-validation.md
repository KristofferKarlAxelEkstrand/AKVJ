---
status: backlog
assignee: mainframe-developer
priority: low
---
# [NIT] Pipeline duplicates project-id validation already in paths.js

## Affected Files
- `mainframe/scripts/clips/Pipeline.js`
- `mainframe/server/paths.js`

## Description
`Pipeline.js` defines a local `PROJECT_ID_PATTERN` and rejects all-numeric ids in `#listProjectIds`. `mainframe/server/paths.js` already exports `isValidProjectId`, which uses the same `CLIP_ID_PATTERN` and applies the same numeric-id guard. Keeping two copies of the same validation rule risks drift.

## Suggested Fix
Import and reuse `isValidProjectId` from `../server/paths.js` (or from a shared location) in `Pipeline.js`.
