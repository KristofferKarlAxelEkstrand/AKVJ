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

# 408 — Event hygiene: AppState

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S1). The epic
names S1 as the unblocker for the rest of the structure wave.

Files: `akvj/src/js/core/AppState.js` and every event consumer under `akvj/src/js/`.

1. Split `EVENT_PROJECT_SWITCH` into `projectSwitchRequested` (note input) and `projectChanged`
   (projectId output). Update all dispatchers and subscribers.
2. Audit the events with no subscriber — `EVENT_CLIPS_LOADED_CHANGED`, `EVENT_BPM_SOURCE_CHANGED`,
   `EVENT_MIDI_START` / `CONTINUE` / `STOP`, `EVENT_CLIP_LOAD_ERROR`, `EVENT_VIDEO_JOCKEY_READY`.
   Wire a real consumer where one is clearly wanted (`DebugOverlay` for transport and BPM source is
   the obvious case) and delete the rest. Say in your report which you wired and which you deleted.
3. Consolidate `activeProjectId` to a single source of truth in `AppState`; `ProjectCatalog` takes
   the id as a parameter instead of holding its own copy.
4. Add `AppState.dispatchClipLoadError(url, message)` and replace the raw `dispatchEvent` call sites.

## Constraints

- No behaviour change visible to a performer. The 60fps render loop and MIDI latency path must be
  untouched — this is wiring, not rendering.
- `akvj/test/AppState.test.js` must cover the `projectSwitchRequested` / `projectChanged` split.

## Verify

- `npm run lint && npm run test && npm run test:visual`
- Every remaining `AppState` event has at least one subscriber. Include the grep you used.
