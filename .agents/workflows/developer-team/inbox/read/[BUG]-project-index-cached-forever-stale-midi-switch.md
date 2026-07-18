# [BUG] Projects index cached forever — MIDI project switch goes stale

## Priority
Medium — live project-switch path (DAW channel 14). Only bites after the projects list changes while AKVJ is already running (create / rename / reorder / delete in Mainframe without reloading the VJ page).

## Where
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#projectIndex`, `#resolveProjectIdFromNote()`

## Problem
```js
async #resolveProjectIdFromNote(note) {
  if (this.#projectIndex.length === 0) {
    this.#projectIndex = await this.#clipLoader.fetchProjectsIndex();
  }
  const projectEntry = this.#projectIndex[note];
  return projectEntry?.id ?? null;
}
```

The index is fetched **once** (when the in-memory array is still empty) and then reused for the lifetime of the custom element. `ProjectCatalog.fetchProjectsIndex()` itself always hits the network — the staleness is entirely this cache.

### Fallout
1. Create project B in Mainframe while AKVJ is open → MIDI note 1 still resolves against the boot-time index (often only `default` at note 0) → switch silently no-ops.
2. Reorder / rename / delete projects → note→project mapping drifts from `projects/index.json` until a full page reload.
3. Task 168’s tests even document “fetches+caches” as current behavior — so the cache is intentional today, but wrong for the shipped live-switch feature.

## Suggested Fix
Pick one (prefer simplest that stays correct under HMR / long sessions):

1. **Refetch every resolve** (index is tiny JSON; Dev already cache-busts via `?t=`). Cheapest correct fix.
2. Or refetch at the start of each `#handleProjectSwitch` / `#switchProject`, still caching only within a single switch attempt.
3. Or invalidate when `setupClipsFromProject` runs / on a visibility/focus signal — more moving parts, not needed if (1) is fine.

Add a unit test: first resolve caches project A; mutate the fetch mock to return `[A,B]`; second resolve with note `1` must return B (today it returns null).

## Notes
- Related: Task 194 already fixed stale *activation* on switch (`clearClips` before catalog swap). This ticket is about stale *routing* of which project a note selects.
- Do not treat channel 14 key-map clip entries here — separate concern if validation should reject mappings on the project-selection channel.
