---
type: report
from: mainframe-developer
to: team-lead
task: 402
created: 2026-07-20T17:00:00Z
---

# Report 402: EDITABLE_META + frameDurationsMs

`frameDurationsMs` is now the single body/meta key; deprecated `loop` no longer editable.

- `mainframe/server/handlers/clips.js` — `EDITABLE_META_FIELDS`: dropped `'loop'`, added `'frameDurationsMs'`; recompile destructures `frameDurationsMs` directly (alias gone).
- `mainframe/server/clipFramesBody.js` — create/frames body key `frameDurations` → `frameDurationsMs`.
- `mainframe/src/js/ClipEditorController.js` — local renamed; all three call sites (L385 frames PUT, L407 meta PUT, L434 create POST) send `frameDurationsMs`.
- `mainframe/test/server.test.js` — `updates metadata fields` used `loop` as its editable field (now `playback`); added `ignores deprecated loop field` and `persists frameDurationsMs on a meta-only PUT`.
- `mainframe/test/clipFramesBody.test.js` — new key.

Verification:
- `npm run lint` — clean
- `npm run test -w mainframe` — 583 + 147 pass
- `npm run test` (root) — 572 + 18 pass
- Meta-only PUT persisting `frameDurationsMs` covered by the new server test.

Note: my edits show up **staged** in `git status` — something in this tree is adding files to the index; I did not run `git add`. Visual screenshots untouched.
