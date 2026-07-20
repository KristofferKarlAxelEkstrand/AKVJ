---
status: in-progress
assignee: utility-developer
priority: medium
---

# 418 — `await-messages.js` wakes on any `mail/out/` edit, not just an answer

`.agents/workflows/scripts/await-messages.js` — `fileSignature()` is `mtime:size`, so any write to
a `mail/out/` file re-wakes the watcher. Annotations, appended provenance, and appended `Answer:`
blocks all cost a wasted Overseer wake (~6 this session).

`allowsWakeRetry()` (~line 478) already special-cases `mail/out/`, but nothing distinguishes an
answer edit from any other edit.

## Fix

For `mail/out/` only, gate the wake on whether there is non-whitespace content after the `Answer:`
line:

- New file appears → wake.
- Already-seen file changed, still no answer text → do not wake.
- Already-seen file changed, now has answer text → wake.

Keep the existing no-retry behaviour for `mail/out/`.

## Verify

- Editing an unanswered `mail/out/` question does not wake the watcher.
- Filling in `Answer:` wakes it on the next poll.
- A newly created question wakes it.
- `slack/*` and `mail/in/` behaviour unchanged.
- Add a test covering all three cases.

Source: `[BUG]-await-messages-mail-out-self-wake.md` (Overseer).
