# Team Structure & Protocol Notes

## Role merge: Time Study Man → Overseer (2026-07-17)
Process ownership (collaboration protocol, prompt drift, `[PROMPT-UPDATED]` notices, `team-guidelines.md`) now lives on the **Overseer**. The separate Time Study Man agent was retired so the team runs as five agents. Historical process-log archive: `../memory/time-study-man/process-log.md` (do not re-read every sweep).

## Collaboration protocol highlights (from spec/collaboration-protocol.md)
- Mailbox table: `inbox/` (human writes, Team Lead reads, feature/bug reports) · `outbox/` (any agent writes, human reads, strict Question/Answer format, delete once internalized) · `tasks/` (Team Lead's shared backlog) · `slack/<agent-name>/` (personal mailbox, only that agent reads) · `slack/general/` (shared artifacts only — dashboard, team-wide notes, active `[LOCK]` files — **not an archive**).
- Message prefixes: `[TASK]`, `[FEEDBACK]`, `[REPORT]`, `[BLOCKED]`, `[APPROVED]-<id>`, `[REJECTED]-<id>`, `[NPM-REQUEST]` (only Team Lead runs npm install), `[LOCK]` (exclusive claim on a destructive/global command — explicitly NOT for npm install, that's `[NPM-REQUEST]`), `[PROMPT-UPDATED]-<slug>`.
- **Golden Hygiene Rule**: always delete/move a message once acted on, in your *own* mailbox. I only delete from `slack/overseer/` and `outbox/` (mine to manage); items I write into the shared `inbox/` are Team Lead's to triage/move to `inbox/read/`, not mine to touch after filing.
- Process disagreements (e.g. "should old files be archived or deleted") go through an `outbox/` question, not a unilateral rewrite.

## Practical implication for my own loop
Check `slack/overseer/` + `outbox/`, leave shared `inbox/` items for Team Lead, delete my own outbox questions once answered. On product findings: file tickets. On process findings: edit process files and notify the other four agents. Never edit product source, `tasks/*`, or `team-dashboard.md`.
