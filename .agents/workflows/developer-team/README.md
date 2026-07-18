# AKVJ Multi-Agent Developer Team

This directory contains an autonomous, multi-agent development workflow. The team consists of **six core** AI agents plus **two optional** specialist roles that communicate asynchronously through a file-based "Slack" system and use an efficient Node.js polling script to wait for tasks without burning API tokens.

## How to Start the Team

To bring the core team online, open **six separate chat windows or terminals** (one for each core agent). Copy and paste the corresponding startup prompt into each window. The two **optional** roles (#7 and #8) are nice-to-have and can be left off — start them in extra windows whenever you want deeper testing or dependency/config attention.

### 1. Spawn the Team Lead
Open your first chat window and paste:
```text
You are the Team Lead. Please read your core instructions at `.agents/workflows/developer-team/prompts/team-lead.prompt.md` and begin your workflow loop.
```

### 2. Spawn the AKVJ Developer
Open your second chat window and paste:
```text
You are the AKVJ Developer. Please read your core instructions at `.agents/workflows/developer-team/prompts/akvj-developer.prompt.md` and begin your workflow loop.
```

### 3. Spawn the Mainframe Developer
Open your third chat window and paste:
```text
You are the Mainframe Developer. Please read your core instructions at `.agents/workflows/developer-team/prompts/mainframe-developer.prompt.md` and begin your workflow loop.
```

### 4. Spawn the QA Reviewer
Open your fourth chat window and paste:
```text
You are the QA Reviewer. Please read your core instructions at `.agents/workflows/developer-team/prompts/qa-reviewer.prompt.md` and begin your workflow loop.
```

### 5. Spawn the Overseer (Bug Hunter, Strategist & Process Keeper)
Open your fifth chat window and paste:
```text
You are the Overseer. Please read your core instructions at `.agents/workflows/developer-team/prompts/overseer.prompt.md` and begin your workflow loop.
```

### 6. Spawn the Nitpicker (Naming, Semantics & Code-Quality Steward)
Open your sixth chat window and paste:
```text
You are the Nitpicker. Please read your core instructions at `.agents/workflows/developer-team/prompts/nitpicker.prompt.md` and begin your workflow loop.
```

### 7. Spawn the Test Marshal (Coverage Hawk) — *optional*
Open another chat window and paste:
```text
You are the Test Marshal. Please read your core instructions at `.agents/workflows/developer-team/prompts/test-marshal.prompt.md` and begin your workflow loop.
```

### 8. Spawn the Quartermaster (Dependencies, Lockfile & Config Hygiene) — *optional*
Open another chat window and paste:
```text
You are the Quartermaster. Please read your core instructions at `.agents/workflows/developer-team/prompts/quartermaster.prompt.md` and begin your workflow loop.
```

## How to Assign Work

Once the core agents are running (they should all report that they are hanging/sleeping via the `await-messages.js` or `await-messages-random.js` scripts), you can assign them work!

1. Create a markdown file (e.g., `feature-add-knob.md`).
2. Write out your feature request or bug report.
3. Save or move the file into `.agents/workflows/developer-team/inbox/`.

**What happens next?**
- The Team Lead will instantly wake up, read your request, update the dashboard, and assign specific tasks to the developers' slack folders.
- The assigned developers will wake up, implement the code, run their own tests, and report back to the Team Lead.
- The QA Reviewer sleeps until the Team Lead sends a `[TASK]-review-*` for completed work, then returns an `[APPROVED]` / `[REJECTED]` verdict (plus optional minor `[FEEDBACK]`). Free-form debt hunting is not QA's job.
- The Overseer wakes every 10–20 minutes (or when pinged), alternating product bug/architecture sweeps with process hygiene audits, filing inbox tickets, pinging agents with `[PROMPT-UPDATED]` notices, and asking high-level questions in the `outbox/`.
- The Nitpicker wakes on a timer (or when pinged) for focused naming/semantics/readability sweeps, filing tidy `[NIT]` inbox tickets (usually one batched checklist per sweep) for the Team Lead to slice. It stays in its lane — small code-quality things that make the code easier for a human to read — and never touches product source. When it has nothing urgent to do, it goes back to sleep instead of looping or self-triggering.
- *(optional)* The Test Marshal wakes on a timer (or when pinged) to hunt test-coverage gaps, flaky/stale tests, and test duplication, filing `[TEST]` inbox tickets for a developer to close. It's report-only (writes no tests itself) and stays out of QA's per-task reviews.
- *(optional)* The Quartermaster wakes on a timer (or when pinged) to check outdated dependencies, `npm audit` advisories, version skew, lockfile hygiene, and config/script health, filing `[DEPS]` inbox tickets. It's report-only — it runs only read-only diagnostics and never installs or edits `package.json`; the Team Lead sequences the actual change.
- You can monitor their progress at any time by opening `.agents/workflows/developer-team/slack/general/team-dashboard.md`.
