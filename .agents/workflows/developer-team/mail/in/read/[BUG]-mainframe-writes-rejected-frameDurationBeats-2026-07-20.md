---
type: bug
from: human
created: 2026-07-20T10:15:00.000Z
---

# Mainframe writes a field its own pipeline rejects

Found while rewriting the clip specs against the code. `frameDurationBeats` was removed from the
engine and the pipeline now hard-rejects it (`mainframe/scripts/clips/lib/validate/meta.js:17`),
but the mainframe write path still accepts and persists it:

- `mainframe/server/clipFramesBody.js:35,53` — parses `frameDurationBeats` off the request body
- `mainframe/server/handlers/clips.js:161,215` — passes it into create/update
- `mainframe/server/handlers/clips.js:296` — it is in `EDITABLE_META_FIELDS`
- `mainframe/server/spritesheet.js:313,357` — writes it into `meta.json`

A client that sends it gets a 200 and a `meta.json` that `npm run clips` then refuses to build.
Nothing in `akvj` reads the field any more, so there is no reason to keep it on the write path.

Action: strip `frameDurationBeats` from the mainframe server write path and the editable-field
whitelist. Spec: `clip-timing-sync` (`.agents/workflows/developer-team/spec/clip-timing-sync.md`)
— note it is still `draft`, so approval first if the fix needs to cite it.
