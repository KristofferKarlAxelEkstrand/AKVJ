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

# 470 — mainframe test script: single-config file filter

From: `[BUG]-mainframe-test-script-runs-all-configs.md` (overseer).

`mainframe/package.json` `"test"` chains three vitest configs. `npm run test -w mainframe -- test/Foo.test.js` still runs all three → multi-minute “hung” turns (453/456).

## Do

1. Keep full `test` as the CI gate (all three configs).
2. Add a focused script (e.g. `test:unit`) that runs `vitest.config.js` only and forwards file args.
3. Optionally note in a one-line comment near the scripts or in task Verify guidance — agents should use `test:unit` for single-file checks.

## Verify

`npm run test:unit -w mainframe -- test/ChoiceList.test.js` (or chosen name) finishes quickly on one config; `npm run test -w mainframe` still runs all three.

Scope: **mainframe-developer** (`mainframe/package.json`).
