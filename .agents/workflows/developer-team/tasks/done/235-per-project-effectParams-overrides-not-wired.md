---
status: done
assignee: akvj-developer
priority: low
---
# Per-project effectParams overrides are advertised but not wired

## Priority
Low — unused code today, but it creates config-drift risk and a misleading public API.

## Affected files
- akvj/src/js/core/settings.js (projectDefaults, mergeProjectSettings)
- akvj/src/js/visuals/ProjectCatalog.js
- akvj/src/js/visuals/ClipLoader.js
- akvj/src/js/visuals/Renderer.js

## Description
settings.js defines a projectDefaults.effectParams block and exports mergeProjectSettings(projectSettings), but no module in akvj/src imports or calls mergeProjectSettings. ProjectCatalog/ClipLoader never fetch a per-project settings.json, and Renderer always passes the top-level settings.effectParams into EffectsPipeline.

This means per-project effect parameter overrides are documented in AGENTS.md and implied by the settings shape, but they have no effect at runtime. Keeping mergeProjectSettings and projectDefaults in the codebase invites future edits that drift out of sync with the real source of truth (settings.effectParams).

## Suggested next step
Either:
1. Wire mergeProjectSettings into the project load path: have ProjectCatalog/ClipLoader fetch projects/{projectId}/settings.json, validate it, and merge it before passing settings to Renderer and EffectsPipeline.
2. Or remove mergeProjectSettings and projectDefaults until per-project settings are actually implemented, and update AGENTS.md to remove the misleading documentation.

## Suggested tests
- If wiring: add ProjectCatalog/ClipLoader test that fetches a project settings.json with overridden effectParams and assert Renderer/EffectsPipeline receives the merged values.
- If removing: add a knip/eslint dead-code check to ensure these exports do not return.
