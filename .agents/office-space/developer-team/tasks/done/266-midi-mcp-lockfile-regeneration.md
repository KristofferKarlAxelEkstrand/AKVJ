---
status: done
assignee: team-lead
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 266: Regenerate lockfile to remove stale `midi-mcp` entry

## Description

`package-lock.json` still contains a stale `"midi-mcp"` entry with `"extraneous": true` even though the workspace was removed. Running `npm install` should regenerate the lockfile and drop the extraneous entry.

## Steps

1. Run `npm install`.
2. Confirm `midi-mcp` no longer appears in `package-lock.json`.
3. Run `npm run lint && npm run test && npm run build` to confirm no side effects.

## Files

- `package-lock.json` (regenerated, not hand-edited)

## Notes

This is a lockfile-only change. Do not hand-edit `package-lock.json`.
