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

# Task 234: Projects Index Cached Forever — MIDI Project Switch Goes Stale

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-project-index-cached-forever-stale-midi-switch.md`

## Affected Files
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#projectIndex`, `#resolveProjectIdFromNote()`

## Description
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
3. Task 168's tests even document "fetches+caches" as current behavior — so the cache is intentional today, but wrong for the shipped live-switch feature.

## Discrete Actions
Pick one (prefer simplest that stays correct under HMR / long sessions):

1. **Refetch every resolve** (index is tiny JSON; Dev already cache-busts via `?t=`). Cheapest correct fix.
2. Or refetch at the start of each `#handleProjectSwitch` / `#switchProject`, still caching only within a single switch attempt.
3. Or invalidate when `setupClipsFromProject` runs / on a visibility/focus signal — more moving parts, not needed if (1) is fine.

## Verification
- Add unit test: first resolve caches project A; mutate the fetch mock to return `[A,B]`; second resolve with note `1` must return B (today it returns null).
- Run `npm run lint`, `npm run test -w akvj`, `npm run build -w akvj`

## Related
- Task 194 already fixed stale *activation* on switch (`clearClips` before catalog swap). This ticket is about stale *routing* of which project a note selects.
- Do not treat channel 14 key-map clip entries here — separate concern if validation should reject mappings on the project-selection channel.

## Status: COMPLETED

This task was already implemented in the codebase. The implementation was found in `akvj/src/js/core/AdventureKidVideoJockey.js` at line 125:

```javascript
async #resolveProjectIdFromNote(note) {
    try {
        const projectIndex = await this.#clipLoader.fetchProjectsIndex();
        return projectIndex[note]?.id ?? null;
```

This implements option 1 from the task - "Refetch every resolve" - which the task describes as the "cheapest correct fix". The implementation correctly:
- Refetches the projects index on every resolve (no caching)
- Has a comment explaining the reasoning: "Refetches on every resolve so Mainframe create/rename/reorder/delete is reflected without a full page reload (index JSON is tiny)"
- Ensures MIDI project switches stay current with Mainframe changes

### Unit Test Already in Place (AdventureKidVideoJockey.test.js:347)
The test `resolveProjectIdFromNote refetches index so new projects appear without reload` already exists and verifies:
- First resolve returns project A from initial index
- Mock is updated to return [A, B] for second resolve
- Second resolve with note 1 correctly returns project B
- Confirms `fetchProjectsIndex` is called twice (proving no caching)

The task description showed the old buggy code with the cache, but the current implementation has already been fixed.

All verification passed:
- ✅ `npm run lint` - No errors
- ✅ `npm run test -w akvj` - All tests passing (including the refetch test)
- ✅ `npm run build -w akvj` - Production build successful
