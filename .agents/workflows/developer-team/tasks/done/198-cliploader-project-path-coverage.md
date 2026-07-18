---
status: done
assignee: none
priority: medium
---

# Task 198: ClipLoader Project Load Path + destroy() Coverage

## Source
`.agents/workflows/developer-team/inbox/read/[TEST]-akvj-cliploader-project-path-coverage.md`
(Test Marshal)

## Scope
Extend `akvj/test/ClipLoader.test.js` only — no product code. Prefer unmocked `ClipLoader` with
existing `mockFetch` / `MockImage` patterns.

## Checklist

### 1. `setupClipsFromProject(projectId)` — zero direct coverage
- Call `setupClipsFromProject('demo')` with catalog + key-map fixtures.
- Assert fetch URLs contain `/projects/demo/clips/clips.json` and
  `/projects/demo/clips/key-map.json`.
- Assert returned tree maps DAW→code channel (e.g. DAW 1 → code 0).
- Assert image `src` uses `…/projects/demo/clips/<clipId>/<png>`.
- Invalid `projectId` (e.g. `../etc`) → throws via `ProjectCatalog.buildProjectKeyMapUrl`.

### 2. `setupClips` when active project is present
- Mock `active-project.json` → `{ project: 'live-set' }` (`ok: true`).
- Call `setupClips('/clips/clips.json', '/clips/key-map.json')`.
- Assert fetches hit `/projects/live-set/clips/…`, not legacy `/clips/…` args.
- Assert image path includes `/projects/live-set/clips/…`.

### 3. `destroy(clips)` — never unit-tested
- Nested clips with `destroy: vi.fn()` → each called once.
- `destroy(null)` / `undefined` → no throw.
- One `destroy()` throws → others still destroyed; `console.error` with `Failed to destroy clip`.

## Files
- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/test/ClipLoader.test.js`

## Out of scope
- ProjectCatalog URL builders (`ProjectCatalog.test.js`)
- `#switchProject` ordering (`AdventureKidVideoJockey.test.js`)
- Task 197 ClipInstance/fsUtils (separate, already assigned)

## Verification
`npm run lint && npm run test && npm run build`
