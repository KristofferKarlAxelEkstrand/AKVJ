# Team Structure & Protocol Notes

## Current roster (2026-07-18)

**Six core** agents always expected online:
1. Team Lead
2. AKVJ Developer
3. Mainframe Developer
4. QA Reviewer
5. Overseer
6. Nitpicker

**Two optional** timer-driven specialists (nice-to-have; may not always run):
7. Test Marshal (Coverage Hawk) — `[TEST]` tickets into `inbox/`
8. Quartermaster — `[DEPS]` tickets into `inbox/`

Canonical process: `../spec/collaboration-protocol.md`. Spawn text: `../README.md`.

## Role merge: Time Study Man → Overseer (2026-07-17)
Process ownership (collaboration protocol, prompt drift, `[PROMPT-UPDATED]` notices, `team-guidelines.md`) lives on the **Overseer**. The separate Time Study Man agent was retired (team then ran as five; later expanded with Nitpicker + optional specialists). Historical process-log archive: `../memory/time-study-man/process-log.md` (do not re-read every sweep).

## Collaboration protocol highlights
- Mailbox table: `inbox/` · `outbox/` · `tasks/` · `epics/` · `slack/<agent-name>/` · `slack/general/` · `slack/quarantine/`.
- Message prefixes: `[TASK]`, `[FEEDBACK]`, `[NIT]`, `[TEST]`, `[DEPS]`, `[REPORT]`, `[BLOCKED]`, `[APPROVED]-<id>`, `[REJECTED]-<id>`, `[NPM-REQUEST]`, `[LOCK]`, `[PROMPT-UPDATED]-<slug>`, `[AWAITING-APPROVAL]-<id>`.
- **Git & Commits**: the human owns commits — agents leave edits in the working tree.
- **Golden Hygiene Rule**: always delete/move a message once acted on, in your *own* mailbox.
- Shared-file `[PROMPT-UPDATED]` notify list: `team-lead`, `akvj-developer`, `mainframe-developer`, `qa-reviewer`, `nitpicker`, `test-marshal`, `quartermaster` (not yourself).

## Practical implication for my own loop
Check `slack/overseer/` + `outbox/`, leave shared `inbox/` items for Team Lead, delete my own outbox questions once answered. On product findings: file tickets. On process findings: edit process files and notify the other agents (full shared-file list above). Never edit product source (`akvj/`, `mainframe/`, `projects/`), `tasks/*`, or `team-dashboard.md`.

## Live note 2026-07-18 ~14:56 — human: agents still not reaching sleep/await
- Human answered Team Lead's `status-get-going-2026-07-18.md`: *"Thanks for update, for some reason the agents do not go to the sleep / await state..."* Relayed to `slack/team-lead/human-answer-get-going-sleep-issue.md`; deleted the outbox file after relay.
- Root cause already documented: `collaboration-protocol.md` § **The Sleep Step** (background await + end turn immediately). Symptom matches foreground await / continuing work after starting sleep / abort storms from overlapping sessions.
- Prior QA-stall outbox closed earlier (*"I think QA is up again"*); heartbeat/liveness still deferred.
- Pulse at 14:56: akvj + mainframe pollers back; QA + Team Lead pollers missing; reviews 200/201/197 queued for QA.

## Human answer 2026-07-18 ~14:48 — QA stall outbox closed
`question-qa-reviewer-stalled-again-severe.md` Answer: *"I think QA is up again"*. Verified: QA memory gained Batch 6 approvals (190–195) at ~14:38 — real recovery for that incident. Heartbeat/liveness sub-question left unanswered (ok — sleep-step + restart-hygiene protocol already landed). As of 14:48 check: **no** `await-messages.js` on `slack/qa-reviewer/` again, and akvj/mainframe still have zero pollers with Tasks 200/197 unread — current bottleneck is developer sessions (see Team Lead status dump), not a 12h QA pile-up.
