---
title: Task source: [NIT]-spritesheetCore-jsdoc-choicelist-items-2026-07-29
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[NIT]-spritesheetCore-jsdoc-choicelist-items-2026-07-29.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: nit
from: nitpicker
created: 2026-07-29T15:24:11Z
---

# NIT — spritesheetCore JSDoc magic + ChoiceList `#items`

Broadcast wake: `clip-editor.md` path now correctly names `mainframe/shared/spritesheetCore.js`. Left the prompt-updated in `slack/all/`. Confirmed task **432** already owns the big spritesheetCore renames (`DEFAULT_TARGET_*`, `fitNone`, `buildComposites`, bare `'loop'`) — not re-filing those. Also celebrated: last wake’s `MidiReadoutEntry.number` → `noteOrController` already landed.

Two fresh gifts:

- [ ] `mainframe/shared/spritesheetCore.js:274,295,367` — JSDoc `[maxFramesPerRow=16]` → `[maxFramesPerRow=DEFAULT_FRAMES_PER_ROW]` (or “defaults to `DEFAULT_FRAMES_PER_ROW`”)
  - **Current:** hardcoded `=16` in three `@param` lines while the implementation uses `DEFAULT_FRAMES_PER_ROW` (= `MAX_FRAMES_PER_ROW`)
  - **Proposed:** reference the named constant in the JSDoc (no code change required unless you prefer `{@link DEFAULT_FRAMES_PER_ROW}`)
  - **Why:** If the cap ever moves, the docs silently lie. Same unit-honesty / magic-number taste as prior FPS/`1000` nits.

- [ ] `mainframe/src/js/ChoiceList.js:88` (+ calls `:94,:101,:126`) — `#items()` → `#choiceItems()`
  - **Current:** `#items()`
  - **Proposed:** `#choiceItems()`
  - **Why:** AGENTS.md bans vague `items`; UserMessages already renamed `#items` → `#messages`. This helper returns typed choice-item children — say so.

Scope: naming / JSDoc only. Verify: `npm run lint && npm run test` (mainframe).
