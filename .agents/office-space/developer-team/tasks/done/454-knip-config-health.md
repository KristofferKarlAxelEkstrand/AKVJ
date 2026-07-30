---
status: done
assignee: utility-developer
priority: medium
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 454 — knip config health

From: `[DEPS]-knip-config-health.md` (quartermaster). Config-only — no product behaviour change.

## Do

1. `knip.json` `ignoreBinaries`: add `ss` — used by `e2e/clearStaleMainframe.js` (`execFileSync('ss', …)`).
2. `knip.json` workspaces: add `monorepo-scripts` with `entry: ["test/**/*.test.js"]` and `project: ["**/*.js"]` (or equivalent) so the 6 vitest suites under `monorepo-scripts/test/` stop looking unused.
3. Optional: add `mainframe/test/smoke/**/*.smoke.js` as a mainframe `entry` glob, **or** leave `fuser`/`pkill` in `ignoreBinaries` and ignore knip's "remove fuser" hint (smoke still calls them).

## Deferred (out of scope)

- sharp WASM optional-deps noise
- knip unused-exports / duplicate-exports (product dead-code → Nitpicker)
- Node 20 CI vs Node 22 container (documented dual target)

## Verify

`npm run knip` (expect no false-positive unused-file noise for `monorepo-scripts/test/` or `ss`).

Scope: **utility-developer** (`knip.json`, root tooling).
