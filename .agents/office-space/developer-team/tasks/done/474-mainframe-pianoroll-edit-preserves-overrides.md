---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 474 — Piano-roll edit strips key-map leaf overrides

From: `[BUG]-pianoroll-edit-strips-keymap-overrides.md` (overseer).

`mappingService.js` flatten/nest preserves `{ clipId, overrides }`, but `pianoRollMappingEdit.js` `noteEntries` / `replaceNoteMappings` rebuild `{clipId, velocity}` only → Save writes bare ids and **wipes** placement overrides.

## Do

1. Carry `overrides` through `noteEntries`, redistribute, and Mainframe `pianoroll:mapping-*` handlers.
2. Unit test: latch/sync object leaf → edit redistribute → nest → overrides still present.

## Verify

`npm run test:unit -w mainframe`, `npm run lint -w mainframe`.

Scope: **mainframe-developer**.
