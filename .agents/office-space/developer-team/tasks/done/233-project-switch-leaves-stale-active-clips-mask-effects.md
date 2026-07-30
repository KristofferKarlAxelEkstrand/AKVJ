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

# Task 233: Project Switch Leaves Stale Active Clips, Mask, and Effects

## Source
Bug report: `.agents/workflows/developer-team/inbox/read/[BUG]-project-switch-leaves-stale-active-clips-mask-effects.md`

## Affected Files
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#switchProject()` (~142–173)
- `akvj/src/js/visuals/LayerManager.js` — `setClips()` / `clearClips()`
- `akvj/src/js/visuals/LayerGroup.js` — `setClips()` does **not** clear `#activeClips` / `#triggerGroups`
- `akvj/src/js/visuals/MaskManager.js` — `setClips()` does **not** clear `#currentMask`
- `akvj/src/js/visuals/EffectsManager.js` — never cleared on project switch

## Description
`#switchProject` currently does:

```js
const newClips = await this.#clipLoader.setupClipsFromProject(projectId);
this.#clipLoader.destroy(this.#loadedClips); // nulls #image on every old Clip
this.#loadedClips = newClips;
this.#layerManager.setClips(this.#loadedClips); // swaps catalog only
```

`LayerManager.setClips()` only rebuilds the velocity cache / mask catalog. It does **not** stop or clear runtime activation state. Meanwhile `LayerManager.clearClips()` already exists and does the right thing (clear Layer Groups A/B/C + mask + effects) — it is simply never called on the switch path.

### Concrete fallout after a switch with held notes / latch / mask / effects

1. **Zombie active clips** — Old `Clip` instances stay in `LayerGroup.#activeClips`. `Clip.destroy()` only nulls `#image` and unsubscribes the clock; it does **not** mark the clip finished or remove it from the active map. `getActiveClips()` still returns them (`!clip.isFinished`), so the render loop keeps iterating them every frame (null-image early-return — wasted work, and they occupy note slots).
2. **Latch / one-shot never self-clear** — Latch and one-shot ignore note-off. A latched clip from project A that was destroyed during the switch stays in `#activeClips` forever unless the same note is re-triggered (which replaces it) or something else clears the group.
3. **Stale mask** — `MaskManager.#currentMask` keeps pointing at the destroyed project-A mask after `setClips` swaps the catalog. Mixer crossfade continues using a dead clip until a new mixer note-on.
4. **Stale effects** — Active mixed-output / global effects from project A are never cleared; they keep applying to project B's output.
5. **Choke-group map** — `#triggerGroups` can retain members pointing at destroyed clips.

## Discrete Actions
1. In `#switchProject`, clear runtime activation **before** (or immediately when) swapping the clip catalog:
   ```js
   this.#layerManager.clearClips(); // already stops A/B/C + mask + effects
   this.#clipLoader.destroy(this.#loadedClips);
   this.#loadedClips = newClips;
   this.#layerManager.setClips(this.#loadedClips);
   ```
2. Order note: clear/stop first while the old Clip objects are still intact, then destroy, then install the new catalog.
3. Optionally consider whether MIDI note-on/off during `#isSwitchingProject` should be ignored (today notes still mutate the about-to-be-destroyed catalog while the renderer is frozen).

## Verification
- Add `AdventureKidVideoJockey` project-switch test: activate a mock clip via `layerManager.noteOn` (and optionally a mask + effect), then switch projects; assert `getActiveClips()` is empty, mask is null, and effects are cleared after the switch completes.
- Update `LayerGroup`/`LayerManager` tests if you choose to clear inside `setClips` (several tests currently assume active clips survive a catalog swap).
- Run `npm run lint`, `npm run test -w akvj`, `npm run build -w akvj`

## Related
- `LayerManager.clearClips()` already implements the correct cleanup — this is a missing call site, not missing machinery
- Project switching itself shipped in Tasks 92/128; tests in `AdventureKidVideoJockey.test.js` cover freeze/load/error paths but never assert post-switch activation hygiene

## Status: COMPLETED

This task was already implemented in the codebase. The implementation was found in `akvj/src/js/core/AdventureKidVideoJockey.js` at line 151:

```javascript
// Stop active clips/mask/effects before destroying the old catalog —
// setClips alone leaves runtime activation pointing at destroyed clips.
this.#layerManager.clearClips();
this.#clipLoader.destroy(this.#loadedClips);
this.#loadedClips = newClips;
this.#layerManager.setClips(this.#loadedClips);
```

The implementation correctly:
- Calls `clearClips()` before destroying the old clip catalog
- Maintains the correct order: clear → destroy → install new catalog
- Has a comment explaining why this is necessary
- MIDI events are already ignored during switch via `#isSwitchingProject` flag (line 54)
- Comprehensive unit test exists in `AdventureKidVideoJockey.test.js` (line 226) that verifies post-switch cleanup

The task description was outdated - it described the problem as if the fix wasn't implemented, but the implementation was already in place.

All verification passed:
- ✅ `npm run lint` - No errors
- ✅ `npm run test -w akvj` - All tests passing
- ✅ `npm run build -w akvj` - Production build successful
