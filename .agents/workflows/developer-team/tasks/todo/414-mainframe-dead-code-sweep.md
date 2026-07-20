---
status: backlog
assignee: none
priority: medium
---

# 414 — Dead-code sweep: mainframe and monorepo-scripts

Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (task S9).

Same rule as 413: confirm each item is unreferenced and report what the grep showed. Anything that
looks deliberate rather than dead stays, with a note.

The epic list is partly stale — its `server/health.test.js` item is already gone, and `clipsaved`
still has three referencing files. Treat every item below as a claim to verify, not a fact.

## Remove

- the `clipsaved` event — documented but never dispatched
- category-filter wiring in `ClipList` and `mainframeState` — never connected in `main.js`
- legacy flat `/api/mapping` routes, superseded by the per-project key-map API. **Check the docs
  and any e2e/smoke test first** — this one is reachable by a human with a curl command, so removing
  it is a real behaviour change, not dead code. If anything still calls it, report instead of
  deleting.
- deprecated path snapshots in `mainframe/server/paths.js`: `CLIPS_DIR`, `KEY_MAP_PATH`,
  `RAW_ASSETS_DIR` — and also `PROJECTS_DIR` / `ACTIVE_PROJECT_PATH` (L23-27). Test Marshal
  confirmed no server code reads the latter two; because they are import-time snapshots and the
  mainframe suite runs `singleFork`, any *future* use of them would be an order-dependent bug that
  passes locally. Deleting them closes the trap rather than just tidying.
- the empty `mainframe/test/fixtures/` directory (still present)
- duplicate npm script aliases — root `clips:*` stays canonical (task 403 already did one pass;
  check what is left)

## Consolidate

- `createMockClip` and the 2D-context factories are duplicated — one copy under `test/utils/`
- shared smoke helpers → a single `pollServer` helper under the smoke tree
- near-duplicate `UserMessages.test.js` cases → one parameterized helper
- rename smoke helpers that carry a misleading `.test.js` suffix to `*.smoke.js`. Check the runner
  globs and `mainframe/test/smoke/startup.smoke.js` pkill strings before renaming — task 403 found
  a script name load-bearing in exactly that way.

## Optional, if the above lands easily

`mainframe/test/server.test.js` mutates one shared `test-clip-a` across ~89 tests, and the `PUT`
describe's `afterEach` restores only `meta.json`, not the sprite — order-dependent by construction,
green today. Test Marshal flagged it as a latent hazard, not a defect. Isolating the fixture is
welcome but is not what this task is judged on; skip it rather than half-doing it.

## Verify

- `npm run lint && npm run test:all`
- `npm run clips` end to end
- no dead imports or exports left behind
