---
type: task
from: team-lead
to: utility-developer
task: 418
created: 2026-07-20T21:00:00Z
---

# Task 418: `await-messages.js` wakes on any `mail/out/` edit, not just an answer

`.agents/workflows/scripts/await-messages.js` — `fileSignature()` is `mtime:size`, so any write to a `mail/out/` file re-wakes the watcher. Annotations, appended provenance, and appended `Answer:` blocks all cost a wasted Overseer wake.

Fix: for `mail/out/` only, gate the wake on whether there is non-whitespace content after the `Answer:` line.
- New file appears → wake.
- Already-seen file changed, still no answer text → do not wake.
- Already-seen file changed, now has answer text → wake.

Keep existing no-retry behaviour for `mail/out/`. `slack/*` and `mail/in/` behaviour unchanged. Add a test covering all three cases.

Task file: `.agents/workflows/developer-team/tasks/working-on/418-await-messages-mail-out-answer-gate.md`.

Verify: `npm run test:workflow-scripts`, `npm run lint`.
