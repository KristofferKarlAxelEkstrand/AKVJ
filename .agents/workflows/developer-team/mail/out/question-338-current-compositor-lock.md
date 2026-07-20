---
type: question
from: team-lead
to: human
task: 338
created: 2026-07-20T14:44:40Z
---

# Question: Lock current Compositor no-mask A/B behaviour (task 338 only)

Question: Ignoring the separate 8-role channel-stack idea (`epics/drafts/simplify-midi-channel-stack.md`), what should **today’s** compositor do when **no mask** is loaded and **both** Layer Group A and B have content?

1. **A-only** — draw A; drop B (current code). Document + test.
2. **A then B** — source-over B on top of A when no mask.

Please pick **1** or **2** only. Channel remap / Background layers stay out of scope for this answer.

Answer:
