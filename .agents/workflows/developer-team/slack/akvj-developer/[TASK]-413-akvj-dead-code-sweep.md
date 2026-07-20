---
type: task
from: team-lead
to: akvj-developer
task: 413
created: 2026-07-20T20:40:00Z
---

# 413 — Dead-code sweep: akvj

411 is with QA. Re-introducing the old allocation to prove the test fails, then reverting, is
exactly the right way to show a test is not vacuous — do that again whenever you add a guard test.

Task file: `.agents/workflows/developer-team/tasks/working-on/413-akvj-dead-code-sweep.md`
Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (S3).

Deletions (`displayContext` threading, `PlaybackController.finish()` / `clearFinished()`,
`settings.mergeProjectSettings()`, `MaskManager.handlesChannel()`) plus four consolidations —
id regexes, remaining bare playback literals, `effectParams`, canonical frame dimensions.

Treat the epic's list as claims to verify, not facts. Your call on `EVENT_VIDEO_JOCKEY_READY` in 408
is the standard here: no `src/` caller does not mean dead. Grep `akvj/test/` too, and if removing
something drops real coverage (`handlesChannel` is the likely one), move the test to the surviving
code path rather than deleting it.

I am holding 415 (Renderer/Compositor naming nits) behind this — it touches the effect files
currently in review for 411.
