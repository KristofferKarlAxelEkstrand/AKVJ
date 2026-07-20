---
type: task
from: team-lead
to: akvj-developer
task: 408
created: 2026-07-20T18:25:00Z
---

# 408 — Event hygiene: AppState

404 and 406 are both archived (404 approved by QA, 406 passed the machine gate).

Task file: `.agents/workflows/developer-team/tasks/working-on/408-akvj-event-hygiene-appstate.md`
Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (S1) — the epic
names this as the unblocker for the rest of the structure wave.

Files: `akvj/src/js/core/AppState.js` + all consumers under `akvj/src/js/`.

Four parts: split `EVENT_PROJECT_SWITCH` into `projectSwitchRequested` / `projectChanged`; wire or
delete the six subscriber-less events (report which you did for each); make `AppState` the single
owner of `activeProjectId`; add `dispatchClipLoadError(url, message)`.

Wiring only — the render loop and MIDI latency path stay untouched. Larger than your recent tickets;
if the dead-event audit turns up something that looks deliberate rather than dead, ask before
deleting it.

QA sent you a `[FEEDBACK]` on the dead `reserved` guard from 404 — fold it in here if it is a
one-liner in the same file, otherwise leave it and say so.
