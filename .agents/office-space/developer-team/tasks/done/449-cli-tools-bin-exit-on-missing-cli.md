---
status: done
assignee: utility-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 449 — cli_tools_bin / test fails when CLIs are missing

From: `[BUG]-cli-tools-bin-exit-on-missing-cli.md` (field-tester).

`npm run test:workflow-scripts -- test/cli-tools.test.js -t "resolves every known"` fails 3/3 in container when `claude` / `agy` absent. Test should assert case arms exist, not that every optional agent CLI is installed. `npm run test:all` must stay green in the documented container.

## Files

- `.agents/workflows/scripts/test/cli-tools.test.js`
- `.agents/workflows/scripts/lib/cli-tools.sh` (`cli_tools_bin`)

## Verify

`npm run test:workflow-scripts -- test/cli-tools.test.js`, `npm run test:all` (or workflow-scripts suite).

Scope: **utility-developer**.
