---
status: done
assignee: akvj-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 228: Add Unit Tests for akvj Core Components

## Source
Finding report: `.agents/workflows/developer-team/inbox/read/test-coverage-gap-core-components.md`

## Affected Files
- `akvj/src/js/core/AppState.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/src/js/visuals/Renderer.js`
- `akvj/src/js/visuals/Clip.js`
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/midi-input/Midi.js`
- `akvj/src/js/visuals/LayerManager.js`

## Description
Core application components have no unit tests, creating high regression risk. Add focused tests for state, MIDI, clip loading/playback, and rendering.

## Discrete Actions
1. Add `AppState` tests for BPM sync (clock, CC, manual), event dispatching, and reset generation.
2. Add `Midi` tests for message parsing, channel routing, and hot-plug behavior.
3. Add `ClipLoader` tests for sanitization, path resolution, and batch loading.
4. Add `Clip` tests for playback modes, timing, retrigger, and BPM sync.
5. Add `Renderer` tests for compositing order and effect integration.
6. Add `LayerManager` tests for MIDI channel routing and cleanup.
7. Add an integration test for the project-switching workflow.

## Verification
- `npm run test -w akvj`
- Coverage reports should show new tests.
- `npm run lint`

## Related Epic
`.agents/workflows/developer-team/epics/project-review.md`
