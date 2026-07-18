---
status: done
assignee: none
priority: high
---

# Task 194: Project Switch Must Clear Stale Active Clips, Mask, and Effects

## Source
`.agents/workflows/developer-team/inbox/read/[BUG]-project-switch-leaves-stale-active-clips-mask-effects.md`
(Overseer / bug hunt)

## Priority
High — live MIDI project-switch path (DAW channel 14). Holding clips/masks/effects across a switch silently corrupts the new project's visual state; latch zombies can linger forever.

## Files
- `akvj/src/js/core/AdventureKidVideoJockey.js` — `#switchProject()` (~142–173)
- `akvj/src/js/visuals/LayerManager.js` — `setClips()` / `clearClips()`
- `akvj/src/js/visuals/LayerGroup.js` — `setClips()` does **not** clear `#activeClips` / `#triggerGroups`
- `akvj/src/js/visuals/MaskManager.js` — `setClips()` does **not** clear `#currentMask`
- `akvj/src/js/visuals/EffectsManager.js` — never cleared on project switch
- Tests: `akvj/test/AdventureKidVideoJockey.test.js` (and LayerManager/LayerGroup tests if API behavior changes)

## Problem
`#switchProject` swaps the clip catalog via `layerManager.setClips()` but never clears runtime activation. `LayerManager.clearClips()` already stops Layer Groups A/B/C + mask + effects — it is simply never called on the switch path.

Fallout after switch with held/latch notes, mask, or effects:
1. Zombie active clips (destroyed images still in `#activeClips`, still iterated every frame)
2. Latch / one-shot never self-clear
3. Stale mask pointing at destroyed project-A clip
4. Stale mixed-output / global effects keep applying to project B
5. `#triggerGroups` can retain members pointing at destroyed clips

## Suggested Fix
Clear runtime activation **before** destroying old clips, then install the new catalog:

```js
this.#layerManager.clearClips(); // already stops A/B/C + mask + effects
this.#clipLoader.destroy(this.#loadedClips);
this.#loadedClips = newClips;
this.#layerManager.setClips(this.#loadedClips);
```

Do **not** casually make `setClips()` always call `clearClips()` without checking callers/tests — several tests rely on active clips surviving a mid-test catalog swap. Prefer the explicit `clearClips()` call in `#switchProject` unless you verify all callers.

Optional same-task follow-up: ignore MIDI note-on/off while `#isSwitchingProject` is true (today notes can mutate the about-to-be-destroyed catalog while the renderer is frozen).

## Tests
- Project-switch test: activate a mock clip via `layerManager.noteOn` (and optionally a mask + effect), switch projects; assert `getActiveClips()` empty, mask null, effects cleared after switch completes.
- If you change `setClips` clearing semantics, update tests that assume active clips survive a catalog swap.

## Verification
`npm run lint && npm run test && npm run build`
