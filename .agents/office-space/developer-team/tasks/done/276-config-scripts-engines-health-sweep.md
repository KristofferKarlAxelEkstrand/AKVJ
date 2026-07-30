---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 276: Config/scripts/engines health sweep

## Source

Quartermaster report: `.agents/workflows/developer-team/mail/in/read/[CONFIG]-config-health-2026-07-19.md`

## Description

Clean up phantom Husky / `lint-staged` references, fix the root `package.json` `vitest` dependency declaration, and resolve the `knip.json` top-level `entry` warning.

## Discrete actions

1. **Docs cleanup:**
   - Remove or reword the claim in `AGENTS.md` (around line 357) that a Husky pre-commit hook runs `lint-staged`.
   - Remove or reword the Husky / pre-commit hook claims in `CONTRIBUTING.md` (lines 46 and 93) to match the manual / IDE-driven verification model.
2. **Root `package.json` dependency:**
   - Add `vitest` to the root `devDependencies` because the script `test:monorepo-scripts` runs `vitest` but the root does not declare it.
   - Create a `[LOCK]` file in `slack/general/` while editing the root `package.json`.
   - After saving, drop a `[NPM-REQUEST]-276.md` file in `slack/team-lead/` so the Team Lead can run `npm install`.
3. **`knip.json` cleanup:**
   - Remove the top-level `entry: ["e2e/**/*.spec.js", "playwright.config.js"]` because `workspaces` is also defined and knip ignores the top-level `entry`.
   - Move those entries into the appropriate workspace config (e.g., an `akvj` or `mainframe` workspace entry) or add a root workspace entry under `workspaces`.
   - Re-run `npm run knip` to confirm the hint is gone.
4. **Verification:**
   - `npm run lint`
   - `npm run test -w mainframe` and `npm run test -w akvj` (or `npm run test` once the pre-existing `akvj` failures from Task 270 are resolved)
   - `npm run build`
   - `npm run knip` (if available)

## Affected files

- `AGENTS.md`
- `CONTRIBUTING.md`
- `package.json`
- `package-lock.json` (via `npm install` after the Team Lead processes `[NPM-REQUEST]`)
- `knip.json`

## Notes

- Do not run `npm install` yourself — only the Team Lead is authorized. Drop `[NPM-REQUEST]-276.md` in `slack/team-lead/` after `package.json` is updated.
- The `akvj` test failures reported with Task 269 are unrelated and should be handled by Task 270.
- No runtime behavior changes; this is config/docs hygiene.
