# Team Structure & Protocol Notes

## New role: Time Study Man (2026-07-17)
A 6th agent role now exists, owning process/collaboration hygiene:
- Owns and is the *only* editor of: `spec/collaboration-protocol.md` (canonical mailbox/message-convention reference) and `slack/general/team-guidelines.md`.
- Does NOT edit product code, `tasks/*`, `slack/general/team-dashboard.md`, or the other spec files (`goal.md`, `code-standards.md`, `aesthetics.md`, `clip-schema.md`) — those stay with Team Lead/developers/QA/Overseer respectively.
- Enforces the "prompt-drift" fix: whenever a `prompts/*.prompt.md` file or a shared file an agent's loop depends on (the protocol doc, team-guidelines.md) changes, Time Study Man drops a `[PROMPT-UPDATED]-<slug>.md` notice into the affected agent's `slack/<agent-name>/` folder (or every agent's, if the changed file is shared). **My workflow already treats `slack/overseer/` as a checked mailbox each cycle, so this will surface automatically — when it does, re-read the named file(s) in full, then delete the notice.**

## Collaboration protocol highlights (from spec/collaboration-protocol.md)
- Mailbox table: `inbox/` (human writes, Team Lead reads, feature/bug reports) · `outbox/` (any agent writes, human reads, strict Question/Answer format, delete once internalized) · `tasks/` (Team Lead's shared backlog) · `slack/<agent-name>/` (personal mailbox, only that agent reads) · `slack/general/` (shared artifacts only — dashboard, team-wide notes, active `[LOCK]` files — **not an archive**).
- Message prefixes: `[TASK]`, `[FEEDBACK]`, `[REPORT]`, `[BLOCKED]`, `[APPROVED]-<id>`, `[REJECTED]-<id>`, `[NPM-REQUEST]` (only Team Lead runs npm install), `[LOCK]` (exclusive claim on a destructive/global command — explicitly NOT for npm install, that's `[NPM-REQUEST]`), `[PROMPT-UPDATED]-<slug>`.
- **Golden Hygiene Rule**: always delete/move a message once acted on, in your *own* mailbox. Confirms what I'd already inferred empirically: I only delete from `slack/overseer/` and `outbox/` (mine to manage); items I write into the shared `inbox/` are Team Lead's to triage/move to `inbox/read/`, not mine to touch after filing.
- Process disagreements (e.g. "should old files be archived or deleted") go through an `outbox/` question, not a unilateral rewrite — good precedent to follow if I ever disagree with a process call myself.

## Practical implication for my own loop
No change needed to my own workflow steps — my existing behavior (check `slack/overseer/` + `outbox/`, leave shared `inbox/` items for Team Lead, delete my own outbox questions once answered) already matches this protocol. Just now formally documented, and I know a `[PROMPT-UPDATED]` notice is how I'll learn if `overseer.prompt.md` itself changes again in the future (as it did once already this session, for the outbox rename).
