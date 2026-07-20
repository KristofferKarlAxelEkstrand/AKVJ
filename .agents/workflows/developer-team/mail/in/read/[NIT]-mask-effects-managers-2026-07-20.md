---
type: nit
from: nitpicker
created: 2026-07-20T17:05:00Z
---

# [NIT] MaskManager / EffectsManager — scrub literal, channel numbers, getter symmetry

Area: `akvj/src/js/visuals/MaskManager.js` + `EffectsManager.js` — idle timer sweep.

Both classes are tidy. `#activeMixedOutputEffects` / `#cachedGlobalEffects` / `#effectTypeByNote` are exactly the kind of names that need no explaining — nice work. Four small gifts to the next reader:

- [ ] `akvj/src/js/visuals/clipMetadata.js` — add `export const PLAYBACK_MODE = Object.freeze({ ONCE: 'once', LOOP: 'loop', PINGPONG: 'pingpong', RANDOM: 'random', REVERSE: 'reverse', SHUFFLE: 'shuffle', SCRUB: 'scrub' });` and derive `PLAYBACK_MODES` from `Object.values(PLAYBACK_MODE)`. Then replace the bare `'scrub'` literal at `MaskManager.js:111`, `LayerGroup.js:229`, `PlaybackController.js:58`, `PlaybackController.js:100`.
  - **Why:** four hand-typed copies of a mode string with no compile-time link to the list that validates it. `TRIGGER_TYPES` in the same file is already the frozen-object precedent.

- [ ] `akvj/src/js/visuals/EffectsManager.js` class header (~L4-6)
  - **Current:** `Channel 9 (mixedOutputEffects)` / `Channel 12 (globalEffects)`
  - **Proposed:** `Channel 10 (mixedOutputEffects, code channel 9)` / `Channel 13 (globalEffects, code channel 12)`
  - **Why:** `AGENTS.md` and every DAW say 10 and 13; the file quotes the code index with no label, so a reader checking against their MIDI setup finds a mismatch. Same class of drift as the LayerManager header nit.

- [ ] `akvj/src/js/visuals/EffectsManager.js` inline comments at L48 (`(channel 9)`) and L58 (`(channel 12)`) — same fix, or drop the parenthetical since the `#...Channel` fields already say it.

- [ ] `akvj/src/js/visuals/EffectsManager.js` `EffectType` typedef (L19)
  - **Current:** includes `'reserved'`
  - **Proposed:** drop `'reserved'` from the union; keep it only as a key of `#effectRanges`.
  - **Why:** the constructor skips `reserved` and `#getEffectType` can never return it, so `ActiveEffect.type` is typed wider than reality — the one value a reader must never handle is advertised as handleable.

- [ ] `akvj/src/js/visuals/MaskManager.js:102` `getBitDepth()` → `getCurrentBitDepth()`
  - **Why:** it returns `#currentBitDepth` and sits next to `getCurrentMask()`; the missing `Current` reads like a static property of the manager rather than of the latched mask.
