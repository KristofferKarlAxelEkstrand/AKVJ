---
type: nit
from: nitpicker
created: 2026-07-20T21:10:00Z
---

# [NIT] PianoRoll / StagingPreview / ClipList — readability sweep (2026-07-20d)

Timer-wake sweep of the largest changed files since 2026-07-19. Celebrations first: `AkvjMainframe.js` now uses `EVENT_PIANOROLL_*` named constants instead of bare `'mappingchange'` / `'keyclick'` strings — lovely. `generateClipId.js` swapped its local `slugifyClipName` for the shared `slugifyPathSegment` — DRY win. `StagingPreview.js` replaced magic `240` / `135` with `DEFAULT_FRAME_WIDTH` / `DEFAULT_FRAME_HEIGHT`. The PianoKey `*request` event naming nit I filed earlier is fully resolved.

Three small gifts:

- [ ] `mainframe/src/js/StagingPreview.js:350` — `#getFrameInterval` → `#getFrameIntervalMs`
  - **Current:** `#getFrameInterval()`
  - **Proposed:** `#getFrameIntervalMs()`
  - **Why:** Returns a duration in milliseconds (`durationMs / this.#playbackSpeed`). Same unit-honesty nit I filed for `PreviewClip.js` — that one was fixed, this is the last holdout. A newcomer can't tell from the name whether it returns ms, seconds, or frames.

- [ ] `mainframe/src/js/ClipList.js:157` — `rolePianoFilter` → `roleFilter`
  - **Current:** `const rolePianoFilter = filters.role || '';`
  - **Proposed:** `const roleFilter = filters.role || '';`
  - **Why:** The sibling locals are `clipIdFilter` and `triggerTypeFilter` — clean `[field]Filter` pattern. The third one breaks the pattern with a "Piano" infix, apparently to avoid collision with `this.#roleFilter`. But a local `roleFilter` does not collide with `this.#roleFilter` (field access requires `this.`). The infix is unnecessary and makes a newcomer wonder why the third filter is special.

- [ ] `mainframe/src/js/PianoRoll.js:376` — dead `??` on `#filterState`
  - **Current:** `this.#filterState = this.#filterState ?? { ...FILTER_DEFAULTS };`
  - **Proposed:** Delete the line (or replace with a comment-only preservation note).
  - **Why:** `#filterState` is initialised at field declaration (L139: `#filterState = { ...FILTER_DEFAULTS }`) and is never set to `null` anywhere — not even in `disconnectedCallback`. The `??` branch is unreachable. The comment above ("Preserve filter state across re-renders") already explains the intent; the actual preservation is done by *not* resetting `#filterState` in `#render()` (unlike `#filterControls`, `#filterSummary`, etc. which ARE reset). The line makes a newcomer wonder "when does this become null?" — answer: never.
