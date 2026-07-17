# Collaboration Protocol (Ways of Working)

This is the canonical reference for *how* the developer team collaborates through the file-based system — the message conventions, mailbox rules, and hygiene that keep six asynchronous agents from stepping on each other. It is owned and kept current by the **Time Study Man**; every other agent should follow it, but only Time Study Man edits it (propose changes to it via the same notify rule described below).

This file is about *process*. Product vision and architecture live in `goal.md`, `code-standards.md`, `aesthetics.md`, and `clip-schema.md` — Time Study Man does not edit those.

## The Mailboxes

| Folder | Who writes | Who reads | Purpose |
| --- | --- | --- | --- |
| `inbox/` | Human | Team Lead | New feature requests / bug reports. Moved to `inbox/read/` once triaged. |
| `outbox/` | Any agent | Human | Questions that need a human decision. Strict `Question:` / `Answer:` format; delete once the answer is internalized. |
| `tasks/` | Team Lead | Team Lead | The shared backlog. Completed tasks move to `tasks/done/`. |
| `slack/<agent-name>/` | Any agent | That agent only | A personal mailbox/PM inbox. This is where `[TASK]`, `[REPORT]`, `[BLOCKED]`, `[FEEDBACK]`, `[APPROVED]`, `[REJECTED]`, and `[PROMPT-UPDATED]` files are dropped for a specific recipient. |
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
| `[PROMPT-UPDATED]-<slug>` | Time Study Man → any agent | A `prompts/*.prompt.md` (or other file that agent depends on) changed on disk. See below. |

## The Golden Hygiene Rule

**Always delete or move a message file once you've acted on it.** A file left sitting in your personal `slack/` folder looks like unread mail on your next wakeup and will re-trigger you (or, worse, be silently re-processed). Every prompt's workflow loop ends with an explicit cleanup step for exactly this reason — it is not optional.

## The Prompt-Drift Problem (why Time Study Man exists)

Every agent's workflow loop re-checks its mailbox on each wakeup, but it does **not** re-read its own `prompts/*.prompt.md` file from disk unless told to. A prompt file can be edited mid-flight and the running agent will keep following the stale version it already has in context, silently drifting out of sync with the process.

**Rule**: any time a `prompts/*.prompt.md` file (or another file an agent's loop depends on, e.g. this protocol doc or `slack/general/team-guidelines.md`) is edited:
1. The editor drops a `[PROMPT-UPDATED]-<slug>.md` file into the affected agent's personal `slack/<agent-name>/` folder.
2. The notice must name the exact file that changed and summarize what changed and why.
3. If the change affects a *shared* file (this protocol doc, `team-guidelines.md`), the same notice goes to **every** agent's personal slack folder, not just one.
4. The receiving agent's first workflow step ("check messages") will surface it; the agent must re-read the named file in full before continuing, then delete the notice.

## Scope Boundaries

- Time Study Man edits *process* files: `prompts/*.prompt.md` (with the notify rule above), this file, `slack/general/team-guidelines.md`.
- Time Study Man does **not** edit product code, `tasks/*`, `slack/general/team-dashboard.md`, or the other spec files — those belong to the Team Lead, developers, QA Reviewer, and Overseer respectively.
- Disagreements about process (e.g. "should old `[REPORT]` files in `slack/general/` be deleted or kept as an archive?") are a good candidate for an `outbox/` question rather than a unilateral rewrite.

## Changelog

- 2026-07-17 — Initial version, written alongside the introduction of the Time Study Man role.
