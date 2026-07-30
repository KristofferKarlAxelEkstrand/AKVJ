---
title: Task source: [NIT]-mainframe-pianoroll-naming-honesty-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-mainframe-pianoroll-naming-honesty-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T14:58:37Z
---

# NIT — PianoRoll / PianoKey / filter-state naming honesty

Timer sweep of today's hot `mainframe/src/js/` piano-roll surface. Celebrations: task **425** landed — StagingPreview `#getFrameIntervalMs`, ClipList local `roleFilter`, and the dead `#filterState ??` line are all gone. `elapsedMs` there too. Lovely.

Four small gifts for the next reader:

- [ ] `mainframe/src/js/PianoRoll.js:133` (+ setter `:298`, getter `:305`, finds `:1556`/`:1592`) — `#clips` → `#loadedClips`
  - **Current:** `#clips`
  - **Proposed:** `#loadedClips` (keep public `clips` getter/setter)
  - **Why:** Same vague `#clips` holdout already renamed in ClipList / mainframeState / LayerGroup. Newcomer can't tell loaded catalog vs active mappings vs selected cells.

- [ ] `mainframe/src/js/PianoKey.js:216-217` — drop dead dual class toggle
  - **Current:** `this.classList.toggle('has-regions', …); this.classList.toggle('has-bands', …);` (identical condition)
  - **Proposed:** Keep only `has-regions` (SCSS + tests already use that name); delete the `has-bands` line
  - **Why:** Terminology split-brain for one concept, and `has-bands` is never read — dead identifier that makes a newcomer hunt for a second styling path that isn't there.

- [ ] `mainframe/src/js/{mainframeState,ClipList,AkvjMainframe}.js` (+ tests) — `pianorollFilters` → `pianoRollFilters`
  - **Current:** `#pianorollFilters` / `pianorollFilters` / `hasPianorollFilters` / event string `pianorollFiltersChanged`
  - **Proposed:** `pianoRollFilters` / `hasPianoRollFilters` / `pianoRollFiltersChanged` (leave DOM `pianoroll:*` event namespace alone)
  - **Why:** CamelCase word break should match `PianoRoll.js`, `pianoRollMappingEdit.js`, and locals like `libraryPianoRoll`. Treating "pianoroll" as one token fights every other identifier in the same feature.

- [ ] `mainframe/src/js/PianoKey.js` + `pianoRollMappingEdit.js` — band `start`/`end` → `startVelocity`/`endVelocity`
  - **Current:** `{ start, end }` on velocity bands; dragState `lowerStart` / `upperEnd`
  - **Proposed:** `{ startVelocity, endVelocity }` (+ `lowerStartVelocity` / `upperEndVelocity`); note in JSDoc that `endVelocity` is exclusive (UI shows `end - 1`)
  - **Why:** Bare `start`/`end` don't say velocity; a newcomer reads them as pixels or notes. Units/domain in the name matches AGENTS.md honesty.

Scope: naming only. Verify: `npm run lint && npm run test` (mainframe package / root suite as usual).
