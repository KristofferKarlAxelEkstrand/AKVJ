---
status: done
assignee: akvj-developer
priority: low
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 199: akvj core/ — Naming Re-check (AdventureKidVideoJockey, AppState)

## Source
`.agents/workflows/developer-team/inbox/read/[NIT]-core-recheck-naming-sweep-2026-07-18.md`
(The Nitpicker)

## Scope
Items 1, 3, and 4 are small renames/constant clarity. **Item 2 (project-switch event split)
is included but treat carefully** — update all listeners/tests that consume `projectSwitch`
(`AkvjLoadingOverlay`, AKVJ tests, etc.). If the event split balloons, finish 1/3/4 first and
note leftover work in the report.

## Checklist

1. **`AdventureKidVideoJockey.js`** — `#teardownMIDIEventListeners()` → `#teardownEventListeners()`
   (or `#unsubscribeAll()`). Clears all `#unsubscribers`, not only MIDI.

2. **`AppState.js` — split project-switch event meanings**
   - Keep a clear *request* event (`EVENT_PROJECT_SWITCH` / `dispatchProjectSwitchRequest` with `{ note }`).
   - Make `activeProjectId` setter silent, or dispatch a distinct `EVENT_ACTIVE_PROJECT_CHANGED`
     (`{ projectId }`) so success-path updates do not re-fire the request event.
   - Update listeners/tests accordingly.

3. **`AppState.js` `#convertCCToBPM`** — stop using `MAX_MIDI_VELOCITY` for CC normalization.
   Introduce/use `MAX_MIDI_DATA_BYTE` (127) shared by velocity and CC; keep `MAX_MIDI_VELOCITY`
   as alias or update non-velocity call sites.

4. **`AdventureKidVideoJockey.js`** — `#setupClips(jsonUrl)` → `#loadClipsFromUrl` (or
   `#loadInitialClips`). Sibling of `#initializeVisuals()`.

## Files
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/visuals/effects/effectConstants.js` (or wherever `MAX_MIDI_VELOCITY` lives)
- Listeners/tests for project-switch events (`AkvjLoadingOverlay`, related tests)

## Out of scope
- `#setBPM` DRY vs `#clampBPM` (Overseer)
- `settings.projectDefaults.effectParams` config drift (Overseer)

## Verification
`npm run lint && npm run test && npm run build`
