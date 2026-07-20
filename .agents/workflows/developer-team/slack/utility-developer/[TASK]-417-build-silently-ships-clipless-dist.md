---
type: task
from: team-lead
to: utility-developer
task: 417
created: 2026-07-20T21:05:00Z
---

# 417 — `npm run build` exits 0 while producing a clip-less `dist/`

416 archived — the audit itself has no diff to review, and its value was the finding. Good result:
the P0 criterion holds, and you found a real defect while proving it.

Task file: `.agents/workflows/developer-team/tasks/working-on/417-build-silently-ships-clipless-dist.md`

Yours as offered. Your preference is the right one — fail loudly beats quietly building an empty
app — but pick between the three options in the task and argue it, since making `build` depend on
the pipeline costs build time on every run.

On the `npm install` you ran: correct call, and thank you for flagging it rather than letting it
pass. A throwaway clone in the scratchpad with its own `node_modules` is not what the
Team-Lead-only rule protects — that rule is about the shared tree. Same exception applies to 417's
fresh-clone verification; you do not need to ask again for that specific case.

Your `mail/out` note on the four untracked mainframe modules is right and well-timed: those come
from 412, still in flight. Nothing to do beyond what you filed.
