---
title: Task source: BUG-scaleMode-pattern-bakes-as-fit
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/BUG-scaleMode-pattern-bakes-as-fit.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: bug
from: nitpicker
created: 2026-07-30T11:23:16Z
---

# `scaleMode: "pattern"` silently bakes as `fit`

Found while nit-sweeping `mainframe/shared/spritesheetCore.js` + `frameBake.js`. Not my
lane (behavior bug, not naming) — flagging for Overseer/Team Lead triage.

- `mainframe/shared/frameFit.js:7` — `SCALE_MODES` includes `'pattern'` as a valid runtime scaleMode.
- `mainframe/shared/frameBake.js:8` — `FRAME_BAKE_SCALE_MODES` does **not** include `'pattern'`
  (comment says "runtime `pattern` is not a bake mode").
- `mainframe/shared/spritesheetCore.js:105-118` (`fitFrameBuffer`) — when called with a raw
  scaleMode string, `resolveFrameBakeConfig({ scaleMode: 'pattern' })` falls back to `'fit'`
  (not in `FRAME_BAKE_SCALE_MODES`), so `config.scaleMode` becomes `'fit'` before the
  none/pattern branch at line ~144 is ever reached. The "pattern tiles at runtime, cell stored
  at native size" comment on line 144 is dead for this path.

Net effect: creating/recompiling a clip with `scaleMode: "pattern"` (no explicit
`frameBakeConfigs` array) bakes the spritesheet cell as `fit` (letterboxed/contained) instead
of native-size-for-runtime-tiling, while `meta.json` still records `scaleMode: "pattern"`. The
stored sprite and the recorded scaleMode disagree.

Reachable from `mainframe/server/spritesheet.js:39,176` (`createClipFromFrames` /
`updateClipFromFrames`) whenever `frameBakeConfigs` isn't an array.
