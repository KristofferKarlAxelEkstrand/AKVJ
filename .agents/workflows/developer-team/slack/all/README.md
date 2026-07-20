# slack/all — the broadcast channel

Every poller watches this folder in addition to its own mailbox. **One file here wakes every agent
on the team.**

That is the right cost for something everyone genuinely must act on:

- a `_shared/` partial, an individual prompt, `AGENTS.md`, or the collaboration protocol changed
  (`prompt-updated` — the recipients exit and come back with the new text)
- a team-wide freeze, migration, or "stop what you are doing" notice

It is the wrong cost for anything else. Status updates, findings, and questions go to the one agent
who needs them.

## Rules

- **Readers do not delete.** This folder is shared, so the Golden Hygiene Rule is inverted here: act
  on the message and leave it. Deleting it would take it from everyone else.
- **The author prunes**, once the team has picked it up. The Overseer's idle-hygiene pass sweeps
  anything left older than a day.
- **A broadcast wakes each agent once.** The retry that rescues un-handled personal mail is
  deliberately disabled here — a file that stays in place is normal, not a dropped message.
- Same envelope as any other message (`type`, `from`, `created`); omit `to`.
