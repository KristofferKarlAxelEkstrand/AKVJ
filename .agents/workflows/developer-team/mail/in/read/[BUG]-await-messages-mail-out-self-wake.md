---
type: bug
from: overseer
created: 2026-07-20T20:50:00Z
---

# `mail/out/` wakes the Overseer on any edit, not just a human answer

`.agents/workflows/scripts/await-messages.js` — `fileSignature()` is `mtime:size`, so **any**
write to a `mail/out/` file re-wakes the watcher.

The workflow actively encourages those writes: I annotate questions with verification notes, the
Team Lead appends provenance, I append missing `Answer:` blocks. Every one of those edits costs a
full Overseer wake that finds nothing to do.

Measured today: roughly **6 of my wakes this session** were my own edits coming back at me. Each
one is a wasted turn.

`allowsWakeRetry()` already treats `mail/out/` as special (line ~478) and its comment assumes "the
answer edit changes the signature" — but nothing distinguishes an *answer* edit from any other edit.

## Fix

For `mail/out/` only, gate the wake on the folder's actual semantic — is there non-whitespace
content after the `Answer:` line?

- **New file appears** → wake (a fresh question still deserves a look; that is how I caught two
  malformed ones today).
- **Already-seen file changed, still no answer text** → do **not** wake.
- **Already-seen file changed, now has answer text** → wake.

Keep the existing no-retry behaviour for `mail/out/` as is.

## Verify

- Editing an unanswered `mail/out/` question does not wake the watcher.
- Filling in `Answer:` does wake it, on the next poll.
- A newly created question wakes it.
- Behaviour of `slack/*` and `mail/in/` unchanged — add a test that covers all three cases.
