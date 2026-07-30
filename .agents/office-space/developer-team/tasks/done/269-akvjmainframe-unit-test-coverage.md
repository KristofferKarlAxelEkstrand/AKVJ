---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 269: Add unit test coverage for `mainframe/src/js/AkvjMainframe.js`

## Description

`AkvjMainframe.js` is a 676-line custom element that bootstraps the entire Mainframe UI, but it has zero direct or indirect unit-test coverage. The existing `mainframe.spec.js` only mounts the page in e2e mode and checks a few elements. Add a jsdom-based unit test suite (`mainframe/test/AkvjMainframe.test.js`) that exercises the orchestration inside `connectedCallback` and `disconnectedCallback`.

## Test Marshal follow-up — harden `AkvjMainframe.test.js`

The initial test suite currently fails the mainframe unit suite with 3 assertion failures and 21 unhandled `StagingPreview` canvas errors. Fix these before reporting the task complete:

1. **Search/role/sort state wiring test over-asserts.** `state search, role filter, and sort mode update library controls` expects `element.querySelector('#clip-search').value` to equal `'neon'`, but `AkvjMainframe.js` only propagates `searchQuery` to `<akvj-clip-list>` and `updateFilterVisibility()`; it does not write the state back into the input element. Correct the test expectation to match source behavior.
2. **`projectactivate` test mock is incomplete.** The test dispatches `projectactivate` for project `'gig'`, but the `api` mock's `defaultApiResponse` does not handle `POST /projects/gig/activate`. `activateProject` receives `{}`, `mainframeState.activeProjectId` falls back to `'default'`, and `loadMapping` fetches `/projects/default/key-map` instead of `/projects/gig/key-map` as the test expects. Add a mock for the activate POST that returns `{ project: 'gig' }`.
3. **`add-mapping` test leaks global `mainframeState` state.** `beforeEach` does not call `mainframeState.reset()`, so `mainframeState.mappings` still contains the boot mapping from `loadMapping()`. The test clicks `#add-mapping` with a different channel/note/velocity and expects `mainframeState.mappings` to contain only the new entry, but the source filters by `(channel, note, velocity)` and the old entry has different values, so it remains. Either reset `mainframeState` in `beforeEach` or correct the assertion to account for existing mappings.
4. **Canvas mock is missing.** `StagingPreview` renders a `<canvas>` in its `connectedCallback` and immediately calls `this.#ctx.imageSmoothingEnabled = false`. In jsdom `getContext('2d')` returns `null` unless `HTMLCanvasElement.prototype.getContext` is mocked, causing 21 unhandled `TypeError: Cannot set properties of null (setting 'imageSmoothingEnabled')` errors across the suite. Add the same canvas mock used in `StagingPreview.test.js` before mounting `akvj-mainframe`, or guard `StagingPreview.#render` against a missing 2d context.

## Scope

Cover the following behaviors in `mainframe/src/js/AkvjMainframe.js`:

- `connectedCallback` initializes once (`#isInitialized` guard), queries DOM, and subscribes to `mainframeState` events.
- `disconnectedCallback` unsubscribes, stops the router, and resets `#isInitialized`.
- Tab click handlers navigate the `SimpleRouter` and `showView` toggles `panel.hidden` / `aria-selected` correctly for `library`, `editor`, `mapping`, and `projects`.
- Deep routes `/clip/edit/:clipId` and `/clip/new/:clipId` call `clipEditor.hydrate()` / `clipEditor.reset()`.
- Library search/role/sort inputs propagate to `mainframeState` and the `<akvj-clip-list>` element.
- `renderLibrary` / `updateClipSummary` reflect `pipelineReady` counts and `clip-summary--has-incomplete` class.
- `fillClipSelect` only includes clips with `hasSprite && pipelineReady !== false`.
- `mappingTableElement` `mappingremove` updates `mainframeState.mappings`.
- `mappingPianoRoll` `mappingadd` / `mappingchange` / `mappingremove` mutate mappings and set `#mapping-status` text/classes.
- `playPianoRoll` `noteon` / `noteoff` update status text.
- `projectChooser` `projectactivate` / `projectcreate` / `projectrename` / `projectdelete` call `api` and update state; delete guards the `default` project and uses `confirm()`.
- `add-mapping`, `save-mapping`, `reload-mapping`, and `run-pipeline` buttons dispatch the correct `api` calls and status messages.
- `deleteClip` uses `confirm()`, calls `api` `DELETE`, then reloads the library.
- `mapClipFromLibrary` switches to the mapping tab and selects the clip in `#map-clip-id` when present.
- Boot path `Promise.all([loadLibrary(), loadProjects(), loadMapping()])` calls `reportBootApiError` on failure.

## Affected files

- `mainframe/test/AkvjMainframe.test.js` (new)
- `mainframe/src/js/AkvjMainframe.js` (read-only; only adapt if tests expose a real bug)
- `mainframe/src/js/apiClient.js` (mock in tests)
- `mainframe/src/js/mainframeState.js` (reset between tests if needed)

## Test environment

- Use `// @vitest-environment jsdom`.
- Mock `api` from `mainframe/src/js/apiClient.js`.
- Import dependent custom elements so the DOM queries succeed.
- Reset `mainframeState` between tests to avoid cross-test pollution.

## Verification

1. `npm run lint` passes.
2. `npm run test` passes (including the new `AkvjMainframe.test.js`).
3. Coverage for `AkvjMainframe.js` is meaningfully improved over zero.

## Notes

- This is a large test file. Keep tests focused and deterministic.
- Prefer mocking `api` and `confirm()` rather than spinning up the real server.
- Do not refactor `AkvjMainframe.js` unless necessary to make it testable; if you do, keep changes minimal and note them in the report.
