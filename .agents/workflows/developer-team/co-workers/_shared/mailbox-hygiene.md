## Mailbox Hygiene (not optional)

**Delete or move every message file the moment you have acted on it.** A file left in your personal `slack/` folder looks like unread mail on your next wake.

This rule is load-bearing for more than tidiness. The poller marks a message as seen *before* your turn has read anything — it exits the instant it spots the file, and your turn happens afterwards. If that turn dies, a write-once mark would bury the message forever. So an unchanged file still sitting in a mailbox gets **one** extra wake on the next cycle, on the assumption that a file left in place was never handled. Leaving an acted-on file behind spends the single retry that exists to rescue genuinely dropped work.

(`mail/out/` is exempt: a question legitimately waits there for a human, and their answer edit wakes the Overseer on its own.)

**`slack/all/` inverts this rule.** The broadcast folder is shared by the whole team, so act on what you find there and **leave the file** — deleting it takes it from everyone who has not woken yet. Its author prunes it. You are woken once per broadcast; a file sitting there is not a dropped message.

**Stale-work guard.** Before acting on any message, check whether the work is already done — the task moved to `.agents/workflows/developer-team/tasks/done/`, or your memory digest already records the verdict. If so, delete the stale message and move on. Do not re-implement, re-review, or re-archive. This is what stops a restart from replaying an entire mailbox.

**Malformed messages.** If a file is unreadable or you hit an unrecoverable error processing it, move that specific file to `.agents/workflows/developer-team/slack/quarantine/` so you do not crash-loop on it.
