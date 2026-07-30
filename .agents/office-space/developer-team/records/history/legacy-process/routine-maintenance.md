---
id: routine-maintenance
title: Routine Maintenance
status: approved
owner: human
maintainer: overseer
approved: 2026-07-20
verified: 2026-07-29
---

# Routine Maintenance

**Workflow hygiene, owned by the Overseer.** Keeps `.agents/workflows/developer-team/` lean when the team is quiet.

Canonical retention table: `collaboration-protocol.md` → *Workflow retention / idle cleanup*. The promote-then-purge playbook is here.

## What an idle agent does *not* do

An idle developer does not go find code work. Test coverage belongs to the Test Marshal, dependencies to the Quartermaster, naming and readability to the Nitpicker, and bugs and architecture to the Overseer — all of them report-only roles that file tickets the Team Lead turns into tracked, assignable, QA-reviewed tasks.

Work done outside that path has no task file, no assignee, no dashboard entry, and no QA verdict. It is invisible to everyone and unreviewed by anyone. If you are idle and see something worth doing, **file a ticket into `mail/in/` and sleep** — do not do it yourself, and never run `npm install` or edit shared config to make it happen.

---

## Workflow hygiene (Overseer owns this)

When idle (no urgent `mail/in/` items, developer slack queues empty or only stale noise, dashboard quiet), **do not invent busywork tickets**. Clean the workflow tree instead:

### Promote then purge

1. **Scan** `mail/in/read/`, `mail/out/`, `slack/*/`, and any dead role folders.
2. **Promote** — if an old note still holds lasting truth that is missing from `spec/`, fold a short bullet into the right spec (the index is `spec/README.md`). Process facts go in `spec/process/`; a *product* fact only goes into a spec if it records shipped behaviour — an idea or intent goes to `epics/drafts/` instead, and a spec's `status` is never yours to change.
3. **Purge** — delete ephemeral leftovers that are already acted on or fully captured in spec/tasks/dashboard. Do **not** create a second archive pile under workflows.
4. **Log** what you promoted vs deleted in `memory/overseer/sweep-log.md`.
5. **Leave alone** — do not edit `tasks/*` or `slack/general/team-dashboard.md` (Team Lead). If the dashboard Done list is huge, drop a short note in `slack/team-lead/` asking them to truncate it.

### Practical targets each idle pass

- Trim `mail/in/read/` toward roughly the **newest ~20** files (promote first, then delete older).
- Clear answered / obsolete `mail/out/` status dumps.
- Empty stuck personal `slack/` files that should have been deleted after processing; remove empty dead role folders (e.g. retired agents).
- Ensure `slack/general/` only has `team-dashboard.md` and active `[LOCK]` files.
- Summarize or trim huge `memory/*/…-log.md` files when they get unwieldy; do not re-read archive memory every sweep.

Batch size: a modest batch per wake is fine — steady cleanup beats one giant wipe.

### Before you purge

Deleting a file that another document points at leaves a dangling reference, and nothing else in the loop notices. After any purge batch, run:

```bash
node .agents/workflows/scripts/check-workflow.js developer-team
```

That runs the reference check, the spec check, and the message-envelope check together. Fix anything it reports — either restore the file or repoint the reference. This has already bitten three times: `AGENTS.md` pointed at a communication-style doc that had been swept away, `goal.md` cited a feature note for "full detail" that no longer existed, and a completed epic pointed at `featue-how-sync-…` — a typo nobody could have followed.

## Changelog

- 2026-07-29 — Re-verified; playbook still matches Overseer process-sweep duties. No wording change.
