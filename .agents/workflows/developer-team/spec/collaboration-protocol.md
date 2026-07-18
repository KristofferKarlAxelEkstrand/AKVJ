# Collaboration Protocol (Ways of Working)

This is the canonical reference for *how* the developer team collaborates through the file-based system — the message conventions, mailbox rules, and hygiene that keep five asynchronous agents from stepping on each other. It is owned and kept current by the **Overseer**; every other agent should follow it, but only the Overseer edits it (propose changes via an `outbox/` question or by flagging process friction in `slack/overseer/`).

This file is about *process*. Product vision and architecture live in `goal.md`, `code-standards.md`, `aesthetics.md`, and `clip-schema.md` — those are also Overseer-owned product specs, separate from this protocol.

## The Mailboxes

| Folder | Who writes | Who reads | Purpose |
| --- | --- | --- | --- |
| `inbox/` | Human | Team Lead | New feature requests / bug reports. Moved to `inbox/read/` once triaged. |
| `outbox/` | Any agent | Human | Questions that need a human decision. Strict `Question:` / `Answer:` format; delete once the answer is internalized. |
| `tasks/` | Team Lead | Team Lead | The shared backlog. Completed tasks move to `tasks/done/`. |
| `epics/` | Team Lead | Team Lead, developers (when assigned a related task) | Living record of large, multi-task initiatives (e.g. `refactor-for-greateness.md`) — status, rationale, and a "check before re-proposing" list so future audits don't rediscover already-shipped work. Team Lead's planning artifact, same ownership model as `tasks/`. |
| `slack/<agent-name>/` | Any agent | That agent only | A personal mailbox/PM inbox. This is where `[TASK]`, `[REPORT]`, `[BLOCKED]`, `[FEEDBACK]`, `[APPROVED]`, `[REJECTED]`, and `[PROMPT-UPDATED]` files are dropped for a specific recipient. |
| `slack/quarantine/` | Any agent | Overseer / Human | The dead-letter queue. If an agent crashes or hits an unrecoverable error reading a file, they move the file here to avoid infinite loops. |
| `slack/general/` | Any agent | Everyone (by convention, not automatic) | Shared artifacts: the team dashboard, team-wide guideline notes, and `[LOCK]` files for exclusive access to global commands (`npm install`, root `package.json` edits). |

## Message Prefix Conventions

| Prefix | From → To | Meaning |
| --- | --- | --- |
| `[TASK]` | Team Lead → a developer | An assigned unit of work. |
| `[FEEDBACK]` | QA Reviewer → a developer | A small, non-blocking fix noticed in passing. |
| `[REPORT]` | Developer → Team Lead | Work finished, self-verified, ready for QA. |
| `[BLOCKED]` | Developer → Team Lead | Self-healing attempts exhausted; needs help. |
| `[APPROVED]-<task-id>` | QA Reviewer → Team Lead | Task verified; safe to move to `tasks/done/`. |
| `[REJECTED]-<task-id>` | QA Reviewer → Team Lead | Task failed audit; stays open, follow-up ticket filed in `inbox/`. |
| `[NPM-REQUEST]` | Developer → Team Lead | Only the Team Lead runs `npm install`; developers request it here. |
| `[LOCK]` | Developer → `slack/general/` | Exclusive claim on a destructive/global command (e.g. root `package.json` edits, global builds). **Not** for `npm install` — use `[NPM-REQUEST]` for that. Delete when done. |
| `[PROMPT-UPDATED]-<slug>` | Overseer → any agent | A `prompts/*.prompt.md` (or other file that agent depends on) changed on disk. See below. |
| `[AWAITING-APPROVAL]-<task-id>` | Developer → Team Lead | A task explicitly required human plan-approval before implementation; the developer submitted its plan to `outbox/` and is correctly blocked, not implementing. See "Plan-Approval Gate" below. |

## The Golden Hygiene Rule

**Always delete or move a message file once you've acted on it.** A file left sitting in your personal `slack/` folder looks like unread mail on your next wakeup and will re-trigger you (or, worse, be silently re-processed). Every prompt's workflow loop ends with an explicit cleanup step for exactly this reason — it is not optional.

## Workflow retention / idle cleanup

Processed mail piles up (`inbox/read/`, answered `outbox/`, stuck slack files). Durable truth belongs in `spec/`; ephemeral files should not live forever. Full playbook: **`routine-maintenance.md`** (Workflow hygiene). The **Overseer** runs this on process/idle wakes when the team is quiet — promote lasting facts into specs, then delete leftovers (no second archive tree).

| Area | Rule |
| --- | --- |
| `inbox/` | Active only; after triage → `inbox/read/`. |
| `inbox/read/` | Cold. On idle cleanup: promote lasting intent to `spec/` if missing, then delete older read mail (keep roughly the newest ~20). |
| `outbox/` | Delete once answered and internalized; obsolete status dumps → delete or one-line note to human. |
| `slack/*/` | Empty after act; purge stale files; remove dead role folders. |
| `slack/general/` | Only `team-dashboard.md`, `team-guidelines.md`, active `[LOCK]`. |
| `memory/*/` | Logs OK; summarize/trim when huge; archive folders are historical — do not re-read every sweep. |
| `tasks/done/` | Keep as completion record; idle cleanup focuses on mail/slack first. |

## The Prompt-Drift Problem (why the Overseer watches process)

Every agent's workflow loop re-checks its mailbox on each wakeup, but it does **not** re-read its own `prompts/*.prompt.md` file from disk unless told to. A prompt file can be edited mid-flight and the running agent will keep following the stale version it already has in context, silently drifting out of sync with the process.

**Rule**: any time a `prompts/*.prompt.md` file (or another file an agent's loop depends on, e.g. this protocol doc or `slack/general/team-guidelines.md`) is edited:
1. The editor drops a `[PROMPT-UPDATED]-<slug>.md` file into the affected agent's personal `slack/<agent-name>/` folder.
2. The notice must name the exact file that changed and summarize what changed and why.
3. If the change affects a *shared* file (this protocol doc, `team-guidelines.md`), the same notice goes to **every other** agent's personal slack folder (`team-lead`, `akvj-developer`, `mainframe-developer`, `qa-reviewer`) — not the Overseer's own folder.
4. The receiving agent's first workflow step ("check messages") will surface it. The agent must **delete the notice and gracefully exit their loop (`exit 0`)**. They will automatically be restarted with the fresh prompt in their system context.

## Plan-Approval Gate

Some tasks explicitly ask a developer to share a plan and wait for the human's approval before writing code (e.g. "please share a brief plan before building so we can align"). The human has confirmed (2026-07-17): when a task asks for this, **the team must actually wait** — not proceed after some elapsed time with a best guess. This happened once (Task 92 shipped ~42 minutes after its plan was submitted, with no answer ever received) and produced a real rework cost, so this is now a hard rule, not a judgment call.

Neither Team Lead nor the developers read `outbox/` — only the Overseer polls it. So the gate is enforced via the normal mailbox path instead of an outbox read:

1. **Developer**: if a task's own text explicitly asks you to get approval on a plan before implementing, do not implement. Write the plan to `outbox/question-<task-id>-*.md` in standard Question/Answer format, then send `[AWAITING-APPROVAL]-<task-id>.md` to `slack/team-lead/` and go to sleep. Do not touch the code for that task until you receive a fresh `[TASK]` reassignment for it.
2. **Team Lead**: on receiving `[AWAITING-APPROVAL]-<task-id>`, do **not** reassign or re-dispatch that task — leave it blocked. Delete the notice only once you send a genuinely fresh `[TASK]` for it (which will only happen after the plan was actually approved).
3. **Overseer**: since I'm the one who actually sees `outbox/` answers, once a gated plan gets an `## Answer`, I file the approved direction as a normal ticket into `inbox/` (same as any other finding) so Team Lead's regular loop picks it up and dispatches a real, approved `[TASK]`. I do not reassign work directly — that stays Team Lead's job.

## Scope Boundaries

- The Overseer edits *process* files: `prompts/*.prompt.md` (with the notify rule above), this file, `slack/general/team-guidelines.md`.
- The Overseer also edits *product specs*: `goal.md`, `code-standards.md`, `aesthetics.md`, `clip-schema.md`.
- The Overseer does **not** edit product source code, `tasks/*`, or `slack/general/team-dashboard.md` — those belong to the Team Lead, developers, and QA Reviewer.
- Disagreements about process (e.g. "should old `[REPORT]` files in `slack/general/` be deleted or kept as an archive?") are a good candidate for an `outbox/` question rather than a unilateral rewrite.

## Changelog

- 2026-07-17 — Added the Plan-Approval Gate (`[AWAITING-APPROVAL]`) after a task shipped without the human's requested approval — human confirmed the team must actually wait, not proceed after a timeout.
- 2026-07-17 — Added workflow retention / idle cleanup (Overseer promote-then-purge; see `routine-maintenance.md`).
- 2026-07-17 — Time Study Man role merged into Overseer; team is five agents; Overseer owns both process protocol and product specs.
- 2026-07-17 — Initial version, written alongside the introduction of the Time Study Man role.
