# [BUG] Project switch leaves stale active clips, mask, and effects

## Priority
High — live performance path. MIDI project switching (DAW channel 14) is a shipped, user-confirmed feature; holding clips/masks/effects across a switch silently breaks the new project's visual state until notes are re-triggered (and latch zombies can linger forever).

## Where
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#switchProject()` (~142–173)
- `akvj/src/js/visuals/LayerManager.js` — `setClips()` / `clearClips()`
- `akvj/src/js/visuals/LayerGroup.js` — `setClips()` does **not** clear `#activeClips` / `#triggerGroups`
- `akvj/src/js/visuals/MaskManager.js` — `setClips()` does **not** clear `#currentMask`
- `akvj/src/js/visuals/EffectsManager.js` — never cleared on project switch

## Problem
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

## Suggested Fix
In `#switchProject`, clear runtime activation **before** (or immediately when) swapping the clip catalog. Minimal change:

```js
this.#layerManager.clearClips(); // already stops A/B/C + mask + effects
this.#clipLoader.destroy(this.#loadedClips);
this.#loadedClips = newClips;
this.#layerManager.setClips(this.#loadedClips);
```

Order note: clear/stop first while the old Clip objects are still intact, then destroy, then install the new catalog. Alternatively, make `setClips()` itself call `clearClips()` (or clear active state) so every catalog swap is safe — but check callers/tests; today several tests rely on `setClips` *not* wiping active state when swapping catalogs mid-test.

Also worth a follow-up (optional, same task or tiny sibling): consider whether MIDI note-on/off during `#isSwitchingProject` should be ignored (today notes still mutate the about-to-be-destroyed catalog while the renderer is frozen).

## Reproduction (manual / test)
1. Load project A, trigger a latch clip (or hold a momentary note), trigger a mixer mask, enable a mixed-output/global effect.
2. MIDI-switch to project B (channel 14 / note → project index).
3. Observe: mask/effects from A still influence B; latch note slot from A still occupied; `getActiveClips()` / mask getter still reference destroyed objects until re-triggered.

## Suggested Tests
- `AdventureKidVideoJockey` project-switch test: activate a mock clip via `layerManager.noteOn` (and optionally a mask + effect), then switch projects; assert `getActiveClips()` is empty, mask is null, and effects are cleared after the switch completes.
- `LayerGroup`/`LayerManager`: if you choose to clear inside `setClips`, update existing tests that currently assume active clips survive a catalog swap.

## Related
- `LayerManager.clearClips()` already implements the correct cleanup — this is a missing call site, not missing machinery.
- Project switching itself shipped in Tasks 92/128; tests in `AdventureKidVideoJockey.test.js` cover freeze/load/error paths but never assert post-switch activation hygiene.
