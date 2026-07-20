# [CONFIG] Config/scripts/engines health sweep — 2026-07-19

## Summary
Config/scripts/engines re-check: no new issues. The same three known doc/dependency/config items remain open and are already tracked by **Task 276**.

## Evidence
- `npm outdated` returned empty `{}`; `npm audit` found `0 vulnerabilities`; no version skew.
- `engines` aligned: root `package.json` requires `node >=20`, CI uses `node-version: '20'`, devcontainer image is Node 22 (compatible).
- Root `package.json` scripts resolve to existing files (verified `team`, `test:smoke`, `test:smoke:mainframe`, `check:*`, `clips:*`, `monorepo-scripts/vitest.config.js`, etc.).
- `knip` reports the same config warnings as the last sweep:
  - **Unlisted `vitest` binary** in root `package.json` (`test:monorepo-scripts`)
  - **Unlisted `vitest/config` dependency** in `monorepo-scripts/vitest.config.js`
  - Both stem from root `package.json` not declaring `vitest` in `devDependencies`.
  - **Top-level `knip.json` `entry` is unused** (`e2e/**/*.spec.js`, `playwright.config.js`) — `knip` suggests moving it into a workspace config.
- Phantom Husky / `lint-staged` references still present:
  - `AGENTS.md` line 357: claims a Husky pre-commit hook runs `lint-staged`.
  - `CONTRIBUTING.md` line 46: lists "A `pre-commit` Husky hook that runs `lint-staged`".
  - `CONTRIBUTING.md` line 93: claims "Pre-commit hooks will automatically run ESLint and Prettier on staged files."
  - No `.husky/` directory, no `husky` or `lint-staged` in any `package.json` `devDependencies`, and no `lint-staged` config.
- `knip` also flags unused exports and an unreferenced test file `akvj/test/smoke/akvj-startup.smoke.js`; these are code-coverage / dead-code items, not dependency/config.

## Known tracking
All actionable items above are already covered by **Task 276** (`276-config-scripts-engines-health-sweep.md`).

## Proposed action
No new ticket needed. Continue tracking cleanup in Task 276; root `vitest` declaration and `knip.json` `entry` fix will need an `[NPM-REQUEST]` when the time comes.
