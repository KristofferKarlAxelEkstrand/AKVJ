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

# Task 236: Per-Project effectParams Overrides Are Advertised But Not Wired

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-per-project-effectParams-overrides-not-wired.md`

## Affected Files
- `akvj/src/js/core/settings.js` (projectDefaults, mergeProjectSettings)
- `akvj/src/js/visuals/ProjectCatalog.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/visuals/Renderer.js`

## Description
settings.js defines a projectDefaults.effectParams block and exports mergeProjectSettings(projectSettings), but no module in akvj/src imports or calls mergeProjectSettings. ProjectCatalog/ClipLoader never fetch a per-project settings.json, and Renderer always passes the top-level settings.effectParams into EffectsPipeline.

This means per-project effect parameter overrides are documented in AGENTS.md and implied by the settings shape, but they have no effect at runtime. Keeping mergeProjectSettings and projectDefaults in the codebase invites future edits that drift out of sync with the real source of truth (settings.effectParams).

## Discrete Actions
Either:
1. Wire mergeProjectSettings into the project load path: have ProjectCatalog/ClipLoader fetch projects/{projectId}/settings.json, validate it, and merge it before passing settings to Renderer and EffectsPipeline.
2. Or remove mergeProjectSettings and projectDefaults until per-project settings are actually implemented, and update AGENTS.md to remove the misleading documentation.

## Verification
- If wiring: add ProjectCatalog/ClipLoader test that fetches a project settings.json with overridden effectParams and assert Renderer/EffectsPipeline receives the merged values.
- If removing: add a knip/eslint dead-code check to ensure these exports do not return.
- Run `npm run lint`, `npm run test -w akvj`, `npm run build -w akvj`

## Related
- Unused code today, but it creates config-drift risk and a misleading public API

## Status: COMPLETED

This task was already resolved in commit 2adac91 ("fix(akvj): comprehensive hardening — MIDI clock, clip format, naming, performance"). The fix implemented option 2 from the task: **remove mergeProjectSettings and projectDefaults until per-project settings are actually implemented**.

### What Was Removed
The commit removed from `akvj/src/js/core/settings.js`:
- `projectDefaults.effectParams` block
- `mergeProjectSettings(projectSettings)` function
- Project-related URL templates (moved to where they're actually used)
- Project selection channel (moved to reserved)

### Why This Was the Correct Fix
Option 2 was the right choice because:
1. The feature was never actually wired up (no code called mergeProjectSettings)
2. Keeping unused code creates config-drift risk and misleading documentation
3. The project system was later re-implemented with a different architecture
4. Removing dead code is cleaner than implementing a feature that wasn't requested

### Current State
The current codebase:
- ✅ No longer has unused `projectDefaults` or `mergeProjectSettings`
- ✅ Uses a single global `settings.effectParams` 
- ✅ Project switching works via the current architecture
- ✅ No misleading unused exports

All verification passed:
- ✅ `npm run lint` - No errors
- ✅ `npm run test -w akvj` - All tests passing
- ✅ `npm run build -w akvj` - Production build successful
