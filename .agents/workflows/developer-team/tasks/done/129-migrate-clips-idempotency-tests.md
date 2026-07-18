---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 129: Harden `migrateFlatClipsToDefaultProject` Idempotency and Add Tests

## Severity: Bug

## Summary
The one-time migration that moves the legacy flat `clips/` pool into `projects/default/` has a false idempotency guard and zero test coverage. Harden it so a partial-crash retry completes correctly and add tests for the irreversible file-moving path.

## Acceptance Criteria
- Make completion idempotency explicit rather than inferred from legacy folder contents.
- After a partial crash, a retry must resume remaining steps (copy docs, remove stale `clips/key-map.json`) instead of silently no-op'ing.
- Add `mainframe/test/migrateClipsToProjects.test.js` covering:
  - Missing/empty legacy dir (no-op).
  - Full legacy pool migration.
  - Raw-assets-only legacy dir.
  - Retry after partial run (simulate pre-existing `projects/default/clips`).
  - Destination receives `key-map.json`, `README.md`, `LICENSE-ASSETS.md`.
- Ensure `migrateFlatClipsToDefaultProject()` returns accurate `migrated` / `clipCount` / `rawMoved` status in all cases.
- Verify `npm run lint`, `npm run test -w mainframe`, and `npm run build -w mainframe` pass.

## Notes
- Source: `inbox/read/[BUG]-migrate-clips-to-projects-false-idempotency-and-no-tests.md`
- The migration is permanent and runs at mainframe boot; correctness matters for fresh clones/environments with a legacy `clips/` folder.
