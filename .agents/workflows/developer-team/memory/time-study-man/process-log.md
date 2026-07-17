# Time Study Man Process Log

This is an append-only log, one entry per sweep, in the same style as the Overseer's `memory/overseer/sweep-log.md`. Read it in full before starting a new sweep so findings aren't re-reported.

## Role Scope (from spec/collaboration-protocol.md)
- Own the *process* the team runs on: mailbox conventions, message prefixes, hygiene, and the `prompts/*.prompt.md` files themselves.
- Never edit product code, `tasks/*`, `slack/general/team-dashboard.md`, or the product spec files (`goal.md`, `code-standards.md`, `aesthetics.md`, `clip-schema.md`).
- Any edit to a file another agent depends on requires a `[PROMPT-UPDATED]` notice to that agent (or to everyone, if the file is shared) — see the protocol doc for the exact mechanism.

## Sweep log

### Sweep 1 — 2026-07-17

**Checked:**
- All 7 prompt files in `../prompts/` for cross-prompt drift
- `../spec/collaboration-protocol.md` for consistency with prompts
- All `../slack/*/` folders for stale/orphaned files and broken loops
- `../slack/general/team-dashboard.md` for desync vs actual slack/tasks state
- `../tasks/` and `../tasks/done/` for task lifecycle hygiene
- `../outbox/` for answered questions (none answered yet)

**Found and fixed (2 bugs):**

1. **NPM Install contradiction** — Developer prompts (both AKVJ and Mainframe) told developers to use the `[LOCK]` protocol to run `npm install` themselves, directly contradicting the collaboration protocol (`[NPM-REQUEST]` prefix: "Only the Team Lead runs `npm install`") and the Team Lead prompt ("YOU are the only agent authorized to run `npm install`"). Fixed both developer prompts: replaced `npm install` in the lock scope with a `[NPM-REQUEST]` instruction. Updated `collaboration-protocol.md` `[LOCK]` row to clarify it excludes `npm install`.

2. **`slack/general/` graveyard** — Developer prompts said "delete it or move to `../slack/general/`" for processed `[TASK]`/`[FEEDBACK]` files. This caused 100+ old message files to accumulate in `slack/general/` (9 `[APPROVED]`, 2 `[FEEDBACK]`, ~50 `[REPORT]`, ~50 `[TASK]`) with no agent responsible for cleanup. The protocol defines `slack/general/` as for shared artifacts only (dashboard, guidelines, locks). Fixed both developer prompts: changed to "delete" only. Added "Slack General Hygiene" section to `team-guidelines.md` codifying the rule. Asked Team Lead to clean up the existing pile.

**Found but not fixed (other agents' lane — noted for future sweeps):**

3. **`tasks/done/` is empty** — At least 8 completed tasks (43, 46, 70, 77, 78, 79, and others) are still in `tasks/` despite being marked Done on the dashboard. The Team Lead prompt says to move them to `tasks/done/` but this hasn't been done. Hygiene issue, not a prompt issue — instruction is already clear.

4. **QA Reviewer stale file** — `[TASK]-review-79-clip-format-audit.md` is still in `slack/qa-reviewer/` despite Task 79 being QA APPROVED on the dashboard. The QA prompt says to delete the task file after sending the verdict. Hygiene issue.

5. **Dashboard desync** — Dashboard says "QA Reviewer Backlog: 61, 62" but QA's slack has review files for 61 and 79 (not 62). Task 79 is marked Done but its review file is still in QA's slack; Task 62 is listed as pending but no review file exists for it. Team Lead owns the dashboard.

6. **Archive prompt in active prompts** — `archive-akvj-and-mainframe.prompt.md` references a legacy `.agents/workflows/servers/` structure that doesn't match the current `developer-team/` layout. Its `archive-` prefix suggests it's intentionally archived in place. Noting but not acting — could be a question for the human if it causes confusion.

**Files changed:**
- `../prompts/akvj-developer.prompt.md` (Step 3: npm install → NPM-REQUEST; Step 5: delete not move)
- `../prompts/mainframe-developer.prompt.md` (same two changes)
- `../spec/collaboration-protocol.md` (`[LOCK]` row: clarified excludes npm install)
- `../slack/general/team-guidelines.md` (new "Slack General Hygiene" section)

**Notified:**
- `slack/akvj-developer/[PROMPT-UPDATED]-npm-and-cleanup.md` — prompt + 2 shared files
- `slack/mainframe-developer/[PROMPT-UPDATED]-npm-and-cleanup.md` — prompt + 2 shared files
- `slack/team-lead/[PROMPT-UPDATED]-protocol-and-guidelines.md` — 2 shared files + cleanup request for existing graveyard
- `slack/qa-reviewer/[PROMPT-UPDATED]-protocol-and-guidelines.md` — 2 shared files
- `slack/overseer/[PROMPT-UPDATED]-protocol-and-guidelines.md` — 2 shared files

### Sweep 2 — 2026-07-17 (random wake, ~2.5 min after sweep 1)

**Checked:**
- All `slack/*/` folders for notification receipt and new issues
- `slack/general/` for graveyard cleanup status
- `tasks/` and `tasks/done/` for task lifecycle progress
- `team-dashboard.md` for desync status

**Results — quiet sweep, no new fixes needed:**
- **Team Lead** processed my `[PROMPT-UPDATED]` — cleaned `slack/general/` from 100+ files down to 3 (dashboard, guidelines, one stray `[TASK]-80`). Also updated dashboard: Task 61 moved to Done with QA REJECTED, Task 81 created, QA backlog desync partially fixed (now shows "62" only).
- **Overseer** processed my `[PROMPT-UPDATED]` — deleted from their slack.
- **AKVJ Developer** and **Mainframe Developer** have not yet woken up — `[PROMPT-UPDATED]` files still in their slack folders. The `[TASK]-80` in `slack/general/` was moved there by the AKVJ developer before reading the update — one-time occurrence, will stop once they read the new prompt.
- **QA Reviewer** has not yet woken up — `[PROMPT-UPDATED]` still in slack. Stale `[TASK]-review-79` and `[TASK]-review-61` files still present (noted in sweep 1).
- **`tasks/done/` still empty** — Team Lead did not move completed tasks to `done/` during this cycle. Instruction is already clear in the prompt; this is a compliance issue, not a prompt issue. Will monitor.
- New task 81 (`wire-mainframe-state-events`) appeared in `tasks/` — Team Lead created it as follow-up to Task 61 QA rejection. Good process flow.

### Sweep 3 — 2026-07-17 (random wake, ~3 min after sweep 2)

**Checked:**
- All `slack/*/` folders for notification receipt and new issues
- `slack/general/` for graveyard status

**Results — quiet sweep, no new fixes needed:**
- **AKVJ Developer** processed `[PROMPT-UPDATED]` (deleted from slack). Now has `[TASK]-38a-akvj-naming-audit.md`. The old `[TASK]-80` was moved to `slack/general/` before they read the update — one-time remnant.
- **Mainframe Developer** processed `[PROMPT-UPDATED]` (deleted from slack). Now has `[TASK]-81-wire-mainframe-state-events.md`. The old `[TASK]-32` was moved to `slack/general/` before they read the update — one-time remnant.
- **Team Lead** has new messages to process: `[APPROVED]-32` and `[FEEDBACK]` from QA. Active and functioning.
- **QA Reviewer** still has not processed `[PROMPT-UPDATED]`. Now has 4 review files (32, 61, 79, 80) — 2 of which (79, 61) are already resolved per dashboard. Backlog growing. Compliance issue, not a prompt bug.
- **`slack/general/`** has 2 stray `[TASK]` files (remnants from pre-update behavior). Team Lead will clean on next cycle.
- **Outbox** question still unanswered. No action needed.

**Assessment:** Fixes from sweep 1 are working. Developers now delete instead of moving to general. No new drift detected. Will continue monitoring on next wake.

### Sweep 4 — 2026-07-17 (outbox wake — Overseer's question answered, not mine)

**Checked:**
- Outbox: question-monochrome-clips-idea.md has an Answer now, but it was filed by the Overseer, not me. Leaving it for the Overseer to internalize and delete.
- All `slack/*/` folders for status updates.

**Results — quiet sweep, no new fixes needed:**
- **QA Reviewer** processed `[PROMPT-UPDATED]` (deleted) AND cleaned up all 4 stale review files (32, 61, 79, 80). Their slack now only has `memory.md`. Full compliance — excellent.
- **Team Lead** still has `[APPROVED]-32` and `[FEEDBACK]` to process. 2 stray `[TASK]` files still in `slack/general/` — will be cleaned on next cycle.
- **Developers** actively working: AKVJ has `[TASK]-38a`, Mainframe has `[TASK]-81`. No issues.
- All 5 `[PROMPT-UPDATED]` notices have now been processed by their recipients. The sweep 1 fixes are fully distributed.

### Sweep 5 — 2026-07-17 (outbox wake — Overseer's follow-up answered, not mine)

**Checked:**
- Outbox: `answer-bitmask-grayscale-clarification.md` is the Overseer's follow-up Q&A with the human. Not mine — leaving it.
- All `slack/*/` folders for status and hygiene.

**Found and fixed (1 bug):**
- **`slack/general/` stray files persisting** — 2 `[TASK]` files have been sitting in `slack/general/` for 3+ sweeps despite the team-guidelines.md cleanup rule I added in sweep 1. Root cause: the Team Lead doesn't re-read `team-guidelines.md` every cycle, so the guideline is invisible to them in practice. Fix: added a cleanup instruction directly to Step 2 of the Team Lead prompt ("while updating the dashboard, also check `slack/general/` for stray files and delete them"). This puts the cleanup in the Team Lead's automatic workflow instead of relying on them reading a file they don't normally re-read.

**Other observations:**
- Team Lead processed `[APPROVED]-32` and `[FEEDBACK]` from last sweep. Now has `[APPROVED]-38a` to process. Active.
- AKVJ Developer completed Task 38a, now has `[TASK]-42`. Good flow.
- Mainframe Developer still on `[TASK]-81`, with a `[FEEDBACK]` from QA. Good.
- Overseer hasn't woken to process the outbox answer yet.

**Files changed:**
- `../prompts/team-lead.prompt.md` (Step 2: added slack/general cleanup instruction)

**Notified:**
- `slack/team-lead/[PROMPT-UPDATED]-slack-general-cleanup.md` — prompt change + immediate cleanup request

### Sweep 6 — 2026-07-17 (random wake)

**Checked:**
- All `slack/*/` folders, `slack/general/`, outbox.

**Results — quiet sweep, no new fixes:**
- **Team Lead** has not yet processed `[PROMPT-UPDATED]-slack-general-cleanup.md` (still in slack). Also has 2 `[APPROVED]` files (42, 81) to process. Stray `[TASK]` files still in `slack/general/` — will be cleaned once they read the notification.
- **AKVJ Developer** — slack empty. Completed Task 42, awaiting new assignment. Normal.
- **Mainframe Developer** — completed Task 81, now has `[TASK]-38b` + pending `[FEEDBACK]`. Good flow.
- **QA Reviewer** — slack clean. Good.
- **Outbox** — new Overseer question (`question-checkin-testing-hardware.md`). Not mine.
- No new prompt drift detected.

### Sweep 7 — 2026-07-17 (random wake)

**Checked:**
- All `slack/*/` folders, `slack/general/`, outbox.

**Results — quiet sweep, all fixes confirmed working:**
- **Team Lead** processed `[PROMPT-UPDATED]-slack-general-cleanup.md` and cleaned `slack/general/` — now only contains `team-dashboard.md` and `team-guidelines.md`. Exactly as intended. Team Lead slack is empty (all messages processed).
- **AKVJ Developer** — slack empty, between tasks. Normal.
- **Mainframe Developer** — working on `[TASK]-38b`. Good.
- **QA Reviewer** — slack clean. Good.
- **Outbox** — Overseer's `question-checkin-testing-hardware.md` still unanswered. Not mine.
- **All sweep 1 + 5 fixes confirmed in production.** No new drift detected. Process is running cleanly.
