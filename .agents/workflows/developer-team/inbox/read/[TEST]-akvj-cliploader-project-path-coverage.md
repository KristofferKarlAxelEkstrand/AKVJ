# [TEST] ClipLoader project load path + destroy untested

**From:** Test Marshal
**Area:** `akvj/src/js/visuals/ClipLoader.js`
**Date:** 2026-07-18
**Tier:** unit (jsdom / Vitest — extend `akvj/test/ClipLoader.test.js`)

## Summary

Rotated to **akvj visuals** after confirming Task 197 (`ClipInstance` / `fsUtils`) is triaged
in-progress. Mapping + sanitize paths in `ClipLoader.test.js` are solid, but every test forces
`active-project` to 404 and never calls `setupClipsFromProject`. Live project switching (MIDI
channel 14) depends on that path; AKVJ tests only **mock** the method, so URL selection and
per-project image paths are never exercised end-to-end through ClipLoader.

`destroy()` is also mocked away in `AdventureKidVideoJockey.test.js` and has no direct unit cases.

`clipDrawRect.js` remains well covered indirectly via `Clip.test.js` scaleMode/placement (including
`MAX_PATTERN_TILES_PER_FRAME`) — no ticket for that.

## Checklist

### 1. `setupClipsFromProject(projectId)` — zero direct coverage

Today: only `vi.spyOn(ClipLoader.prototype, 'setupClipsFromProject')` in
`AdventureKidVideoJockey.test.js`. Real implementation never runs in tests.

**Add** (unmocked `ClipLoader`, same `mockFetch` / `MockImage` pattern as existing tests):

- Call `setupClipsFromProject('demo')` with catalog + key-map fixtures.
- Assert fetch URLs contain `/projects/demo/clips/clips.json` and
  `/projects/demo/clips/key-map.json` (from `settings.performance.projectClipsJsonUrlTemplate` /
  `projectKeyMapUrlTemplate`).
- Assert returned tree maps DAW→code channel as usual (e.g. DAW 1 → code 0).
- Assert image `src` uses project path:
  `…/projects/demo/clips/<clipId>/<png>` (`projectClipsPathTemplate` + `activeProjectId`).
- Invalid `projectId` (e.g. `../etc`) → throws via `ProjectCatalog.buildProjectKeyMapUrl`
  (same guard already unit-tested on ProjectCatalog; one ClipLoader integration assert is enough).

### 2. `setupClips` when active project is present

`mockFetchCatalogAndLayout` always returns 404 for `active-project`, so the branch that rewrites
catalog/key-map URLs never runs.

**Add:**

- Mock `active-project.json` → `{ project: 'live-set' }` (`ok: true`).
- Call `setupClips('/clips/clips.json', '/clips/key-map.json')` (default/legacy args).
- Assert fetches hit `/projects/live-set/clips/…`, **not** the legacy `/clips/…` args.
- Assert image path includes `/projects/live-set/clips/…`.

### 3. `destroy(clips)` — never unit-tested

AKVJ suite spies `ClipLoader.prototype.destroy` to a no-op. Real nested walk is untested.

**Add:**

- Build a small nested clips object with mock clips that have `destroy: vi.fn()`.
- `loader.destroy(clips)` → each `destroy` called once.
- `loader.destroy(null)` / `undefined` → no throw.
- Clip whose `destroy()` throws → other clips still destroyed; error logged
  (`console.error` with `Failed to destroy clip`).

### Out of scope / already covered

- ProjectCatalog URL builders and `fetchActiveProjectId` — `ProjectCatalog.test.js`.
- AKVJ `#switchProject` clearClips-before-destroy ordering — `AdventureKidVideoJockey.test.js`.
- Mapping sanitize / unknown clipId / object overrides — existing `ClipLoader.test.js`.
- `clipDrawRect` pure math — covered via `Clip.test.js` scaleMode + placement block.

## Notes for Team Lead

- Prefer extending `ClipLoader.test.js`; no new product code.
- Suites were green on last full run; this is missing coverage, not a red suite.
- Task 197 still OPEN — do not re-file ClipInstance/fsUtils.
