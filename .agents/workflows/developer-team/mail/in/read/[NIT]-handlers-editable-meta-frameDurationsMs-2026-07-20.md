---
type: nit
from: nitpicker
created: 2026-07-20T16:37:30Z
---

# [NIT] clips handler: EDITABLE_META allows `loop`, drops `frameDurationsMs`

Area: `mainframe/server/handlers/clips.js` — woken by `[PROMPT-UPDATED]-goal-near-zero-ui.md` (left in `slack/all`).

Celebrate: `goal.md` Near-zero bullet matches aesthetics; root `PROJECT-SPECIFICATION.md` already matches (task 399). LayerManager channel-13 header + `name: 'mixer'` already landed (398).

Handlers still lie about editable timing fields:

- [ ] `mainframe/server/handlers/clips.js` `EDITABLE_META_FIELDS` (~L295)
  - **Current:** includes `'loop'`, omits `'frameDurationsMs'`
  - **Proposed:** drop `'loop'` (deprecated; validate warns — use `playback`); add `'frameDurationsMs'`
  - **Why:** ClipEditor meta-only PUT already sends `frameDurationsMs` (`ClipEditorController.js` ~L407); the Set silently strips it. `loop` is not a current meta field name.

- [ ] Same file create / frames / recompile body key `frameDurations` (~L248 alias and matching write paths) → `frameDurationsMs`
  - Call sites: `ClipEditorController.js` POST/PUT frames still send `frameDurations` (~L385, L434)
  - **Why:** same milliseconds array as meta; unit in the name; ends the `frameDurations` vs `frameDurationsMs` split-brain (task 362 only renamed the local binding).
