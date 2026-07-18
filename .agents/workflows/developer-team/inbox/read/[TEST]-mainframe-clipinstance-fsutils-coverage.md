# [TEST] ClipInstance branch gaps + fsUtils EPERM fallback untested

**From:** Test Marshal
**Area:** `mainframe/src/js/ClipInstance.js`, `mainframe/scripts/clips/lib/fsUtils.js`
**Date:** 2026-07-18
**Tier:** unit (jsdom for ClipInstance; node for fsUtils)

## Summary

After confirming Tasks 191 / 192 / 195 (PianoKey drag, ClipFrame/StagingPreview bake draw,
ClipFrames + controller bake wiring) are done and covered, this sweep rotated to mainframe library
UI + clip-pipeline utilities.

`ClipInstance` is exercised through `ClipList.test.js` for happy-path edit/delete/map/drag, but
several important branches never run. `copyFileWithFallback` is used by optimize, copy, and
Pipeline on every clip build — its EPERM/ENOSYS read/write fallback (critical on 9p / Dev Container
mounts) has **zero** direct tests.

Suites are green (akvj 448 passed). These are missing cases, not a red suite.

## Checklist

### 1. `ClipInstance.js` — untested branches (extend `ClipList.test.js` or add `ClipInstance.test.js`)

Happy paths already covered: `clipedit` / `clipdelete` / `clipmap` dispatch, dragstart sets
`application/x-akvj-clip-id` + `text/plain`. Still missing:

| Path | Gap |
| --- | --- |
| `pipelineReady === false` | Map button should be **disabled**; meta text should include `· incomplete` |
| Drag from a button | `#handleDragStart` when `event.target.closest('button')` → `preventDefault()`, no `setData` |
| Name ≠ clipId | Meta should show `.clip-id-label` with ` (clipId)` after the strong name |
| `hasSprite === true` | `img.src` should include `/api/clips/<id>/sprite` |
| `disconnectedCallback` | Removes `dragstart` listener and clears children |

**Add** (prefer extending `ClipList.test.js` so fixtures stay consistent):

- Clip with `pipelineReady: false` → `.clip-map` disabled; text contains `incomplete`.
- Dispatch `dragstart` with `target` set to `.clip-edit` (or a child button) → event defaultPrevented /
  no clip-id in dataTransfer.
- Clip with `meta.name` different from `clipId` → `.clip-id-label` text is ` (clipId)`.
- Clip with `hasSprite: true` → `img.src` matches `/api/clips/<encoded-id>/sprite`.
- Remove the host / call disconnect → no children; optional: second dragstart after disconnect does
  not set data (listener gone).

### 2. `fsUtils.js` — `copyFileWithFallback` (new `mainframe/test/fsUtils.test.js`)

`optimize.js` / `copy.js` / `Pipeline.js` all import this. Happy `fs.copyFile` is exercised
indirectly; the container fallback is not:

| Case | Expected |
| --- | --- |
| `fs.copyFile` succeeds | Dest matches source |
| `fs.copyFile` rejects with `code: 'EPERM'` | Falls back to `readFile` + `writeFile`; dest matches source |
| `fs.copyFile` rejects with `code: 'ENOSYS'` | Same fallback |
| Other error codes (e.g. `ENOENT`) | Rethrows; dest not written |

Mock `fs/promises` (or inject via `vi.mock`) so the EPERM/ENOSYS paths do not depend on a real 9p
mount. Keep assertions on dest file bytes, not only "did not throw".

### 3. Product note (not a test task — for Overseer / Team Lead)

`ClipInstance` JSDoc `@fires clipsaved` and `main.js` listens for `clipsaved` on the clip list, but
`ClipInstance.js` never dispatches `clipsaved`. Likely dead wiring / stale docs — not a coverage
gap until something is supposed to emit it.

## Out of scope (already covered or low signal)

- Tasks 191 / 192 / 195 bake/composition/PianoKey coverage — confirmed done in tree.
- `hash.isCacheValid` true-path — covered indirectly by `optimizeFile skips when cache is valid`.
- `ChoiceItem` / `ChoiceList` / `ClipCategory` — strong indirect coverage via Role/Sort/ClipList tests.
