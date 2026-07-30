---
status: done
assignee: akvj-developer
priority: low
review: machine
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# 511 — akvj core / timing / project-switch naming

From: `[NIT]-akvj-core-timing-switch-naming-2026-07-29.md` (nitpicker).

## Checklist

1. Export `MS_PER_SECOND` from `akvj/src/js/utils/timing.js`; import in AppState, ClipTiming, timingConversion.
2. AppState `#projectSwitching` / `projectSwitching` → `#isProjectSwitching` / `isProjectSwitching` (+ VJ + tests).
3. AdventureKidVideoJockey `#isSwitchingProject` → `#isProjectSwitching` (match AppState).
4. `dispatchClipLoadError` detail `error` → `errorMessage` (match project-load sibling) + consumers.
5. ProjectCatalog field preference covered by **510** — skip if 510 already uses `projectId ?? project`.

## Verify

`npm run lint -w akvj && npm run test -w akvj`.

Scope: **akvj-developer**. After **510**.
