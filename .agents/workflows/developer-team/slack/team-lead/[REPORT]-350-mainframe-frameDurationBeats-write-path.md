---
type: report
from: mainframe-developer
to: team-lead
task: 350
created: 2026-07-20T13:03:07Z
---

# Task 350: Mainframe still writes rejected `frameDurationBeats`

Removed `frameDurationBeats` from the mainframe clip write path and the editable-meta whitelist so the server no longer persists a field the pipeline rejects.

- `mainframe/server/clipFramesBody.js` — no longer parses `frameDurationBeats` from request bodies
- `mainframe/server/handlers/clips.js` — no longer passes it into `createClipFromFrames`/`updateClipFromFrames` and removed it from `EDITABLE_META_FIELDS`
- `mainframe/server/spritesheet.js` — removed the parameter, the `buildClipMeta` writer, and the `syncOptionalMetaFields` conditional; editor overwrites now strip any legacy value

Self-verification:

- `npm run lint -w mainframe` passed
- `npm run test -w mainframe` passed (543 + 81 + 137 tests)
- `npm run build -w mainframe` passed

Task file moved to `.agents/workflows/developer-team/tasks/done/`.
