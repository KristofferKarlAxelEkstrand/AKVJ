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

# 475 — mappingService readyClips / validIds → readyClipIds

From: `[NIT]-mappingService-readyClipIds-2026-07-29.md` (nitpicker). Rename only.

Unify Set-of-id params in `mainframe/shared/mappingService.js` to **`readyClipIds`** (not clip objects). Update JSDoc + call sites: `handlers/projects.js`, `scripts/clips/lib/validateMapping.js`, `mappingService.test.js`. Leave MappingTable’s local `readyClips` object array alone.

## Verify

`npm run lint -w mainframe`, `npm run test:unit -w mainframe`.

Scope: **mainframe-developer**.
