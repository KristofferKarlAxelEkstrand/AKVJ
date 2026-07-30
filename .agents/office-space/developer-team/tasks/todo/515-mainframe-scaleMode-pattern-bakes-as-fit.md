---
status: todo
stage: queued
priority: high
assignee: none
work_class: general
risk: high
created: 2026-07-30
owned_paths:
  - mainframe/shared/frameBake.js
  - mainframe/shared/spritesheetCore.js
  - mainframe/test/
verification_tier: integration
migration_source: legacy-workflow
migration_previous_state: in-progress
---
> Migration note: the legacy team stopped while this card was active. It was safely returned to `queued`; inspect the working tree before claiming.

# 515 — `scaleMode: "pattern"` silently bakes as `fit`

Reported by Nitpicker (`[BUG]-scaleMode-pattern-bakes-as-fit`, forwarded via mail/in).

`mainframe/shared/frameFit.js:7` — `SCALE_MODES` includes `'pattern'` as a valid runtime
scaleMode. `mainframe/shared/frameBake.js:8` — `FRAME_BAKE_SCALE_MODES` does **not** include
`'pattern'` (comment: "runtime `pattern` is not a bake mode").

In `mainframe/shared/spritesheetCore.js` `fitFrameBuffer()` (~line 105), when called with a raw
scaleMode string, `resolveFrameBakeConfig({ scaleMode: 'pattern' })` falls back to `'fit'`
(not in `FRAME_BAKE_SCALE_MODES`), so `config.scaleMode` becomes `'fit'` before the none/pattern
branch at ~line 144 is reached. The "pattern tiles at runtime, cell stored at native size"
comment is dead for this path.

Net effect: creating/recompiling a clip with `scaleMode: "pattern"` (no explicit
`frameBakeConfigs` array) bakes the spritesheet cell as `fit` (letterboxed/contained) instead of
native-size-for-runtime-tiling, while `meta.json` still records `scaleMode: "pattern"`. Stored
sprite and recorded scaleMode disagree.

Reachable from `mainframe/server/spritesheet.js:39,176` (`createClipFromFrames` /
`updateClipFromFrames`) whenever `frameBakeConfigs` isn't an array.

Fix the fallback so a raw `scaleMode: 'pattern'` bakes as native-size (the `none`/`pattern`
branch), not `'fit'`. Add a regression test covering `fitFrameBuffer` / bake-path with a raw
`'pattern'` scaleMode string and no explicit `frameBakeConfigs`.
