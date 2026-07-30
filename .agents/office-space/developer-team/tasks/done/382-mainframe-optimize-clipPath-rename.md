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

# Task 382: Rename optimize `clipPath` → `clipId`

## Source

Nitpicker `[NIT]-optimize-clipPath-is-clipId-2026-07-20.md`

## Description

Rename-only — value is a clip folder id, not a filesystem path.

- [ ] `mainframe/scripts/clips/lib/optimize.js` — `result.clipPath` → `result.clipId`; optional `OptimizeResult` JSDoc
- [ ] `mainframe/scripts/clips/Pipeline.js` — log uses `result.clipId`

## Verification

- `npm run lint -w mainframe` / clip pipeline tests pass
