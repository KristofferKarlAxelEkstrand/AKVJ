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

# Task 281 (P0-3): Fix `akvj/package.json` `build:full` script

Part of `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md`.

## Goal

`build:full` currently tries to run `npm run clips` from inside the `akvj/` workspace, but the `clips` script is only defined at the root.

## Changes

Choose one:
- **Option A (simpler):** Delete the workspace-local `build:full`; keep the root one as canonical.
- **Option B:** Repoint to `npm run -w .. clips` or equivalent root reference.

Then update docs/README/CI references so they point to the root command only.

## Verify

- `npm run build:full` from root succeeds.
- No stale references to the workspace-local `build:full` remain.

## Affected files

- `akvj/package.json`
- README / docs / CI references (if any)

## Notes

- This is Priority 0; complete after P0-1 lands.
