---
status: done
assignee: akvj-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 173: Fix Broken Smoke Script Paths + Remove Phantom Husky/lint-staged Docs

## Source
`.agents/workflows/developer-team/inbox/[DEPS]-config-health-broken-scripts-phantom-husky.md`
(Quartermaster — config health check).

## Problem

### 1. Broken smoke test scripts (wrong file extensions)
Root `package.json` scripts reference `.test.js` but files were renamed to `.smoke.js` in Task 170:
- `"test:smoke": "node mainframe/test/smoke/startup.test.js"` → should be `startup.smoke.js`
- `"test:smoke:mainframe": "node mainframe/test/smoke/mainframe-startup.test.js"` → should be `mainframe-startup.smoke.js`
- `test:e2e:all` calls `npm run test:smoke` so it's also broken

**Fix:** Update the two script paths: `.test.js` → `.smoke.js`

### 2. README.md references Husky and lint-staged that don't exist
- `README.md` line 277 claims Husky + lint-staged are used
- No `husky` or `lint-staged` in devDependencies, no `.husky/` dir, no lint-staged config
- **Fix:** Remove the "Git Hooks" section (lines 275–277)

## No lockfile or NPM changes needed.

## Verification
- `npm run test:smoke` — should no longer error with "module not found"
- `npm run lint`
- Verify README no longer mentions Husky/lint-staged

## Files
- `package.json` (root — fix script paths)
- `README.md` (root — remove Git Hooks section)
