---
status: done
assignee: mainframe-developer
priority: low
---

# Task 240: Pipeline Duplicates Project-ID Validation Already in paths.js

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[NIT]-mainframe-pipeline-duplicate-project-id-validation.md`

## Affected Files
- `mainframe/scripts/clips/Pipeline.js` — local `PROJECT_ID_PATTERN`
- `mainframe/server/paths.js` — `isValidProjectId`

## Description
`Pipeline.js` defines a local `PROJECT_ID_PATTERN` and rejects all-numeric ids in `#listProjectIds`. `mainframe/server/paths.js` already exports `isValidProjectId`, which uses the same `CLIP_ID_PATTERN` and applies the same numeric-id guard. Keeping two copies of the same validation rule risks drift.

## Discrete Actions
Import and reuse `isValidProjectId` from `../server/paths.js` (or from a shared location) in `Pipeline.js`.

## Verification
- Add test to verify Pipeline.js uses the shared validation function
- Run `npm run lint`, `npm run test -w mainframe`, `npm run build -w mainframe`

## Related
- Code duplication issue that could lead to validation drift
- Low priority cleanup task
