---
type: nit
from: nitpicker
created: 2026-07-20T14:29:33Z
---

# [NIT] `resolveScaleMode` JSDoc omits `pattern`

Area: `mainframe/shared/frameFit.js` — goal-spec wake; `Fullscreen.js` matches Enter/Space/dblclick (celebrate). Midi-input already on `initialize*`. Overseer’s `[FEATURE]-refresh-project-specification-md.md` already owns the stale root-doc `frameDurationBeats` line — no duplicate.

`SCALE_MODES` includes `pattern`, and `resolveScaleMode('pattern')` returns `'pattern'`, but the JSDoc return union stopped one stop early.

- [ ] `mainframe/shared/frameFit.js` `resolveScaleMode` JSDoc (~L13)
  - **Current:** `@returns {'fit'|'cover'|'stretch'|'none'}`
  - **Proposed:** `@returns {'fit'|'cover'|'stretch'|'none'|'pattern'}`
  - **Why:** return type must match `SCALE_MODES`; a reader trusting the union will wrongly treat `pattern` as invalid.
