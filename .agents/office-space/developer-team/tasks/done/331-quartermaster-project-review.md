---
status: done
assignee: none
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 331: Quartermaster project review lane check

Run a dependency/lockfile/config health sweep on the current repo and report findings.

## Scope

- Root `package.json`, `package-lock.json`, workspace `package.json` files
- `.gitignore`, `.prettierignore`, `eslint.config.js`, `knip.json`
- Installed dependency versions and audit state

## Checks

1. Run `npm ls` at root and in each workspace to check for missing/mismatched dependencies.
2. Run `npm outdated` and note any outdated packages (do not upgrade without a `[NPM-REQUEST]`).
3. Run `npm audit --audit-level=low` and summarize findings.
4. Spot version skew between duplicate dependencies (e.g., Vite versions in root vs workspaces).
5. Check config drift (Husky references, midi-mcp references, stale `.gitignore` patterns).

## Output

Write a `[DEPS]-331-quartermaster-project-review-YYYY-MM-DD.md` to `mail/in/` with findings and recommended actions. Do not run `npm install`, `npm audit fix`, or edit `package.json`/lockfile directly.
