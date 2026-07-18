# AKVJ Multi-Agent Developer Team

This directory contains an autonomous, multi-agent development workflow. The team consists of **five** AI agents that communicate asynchronously through a file-based "Slack" system and use an efficient Node.js polling script to wait for tasks without burning API tokens.

## How to Start the Team

To bring the team online, open **five separate chat windows or terminals** (one for each agent). Copy and paste the corresponding startup prompt into each window.

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

## How to Assign Work

Once all five agents are running (they should all report that they are hanging/sleeping via the `await-messages.js` or `await-messages-random.js` scripts), you can assign them work!

1. Create a markdown file (e.g., `feature-add-knob.md`).
2. Write out your feature request or bug report.
3. Save or move the file into `.agents/workflows/developer-team/inbox/`.

**What happens next?**
- The Team Lead will instantly wake up, read your request, update the dashboard, and assign specific tasks to the developers' slack folders.
- The assigned developers will wake up, implement the code, run their own tests, and report back to the Team Lead.
- The QA Reviewer sleeps until the Team Lead sends a `[TASK]-review-*` for completed work, then returns an `[APPROVED]` / `[REJECTED]` verdict (plus optional minor `[FEEDBACK]`). Free-form debt hunting is not QA's job.
- The Overseer wakes every 10–20 minutes (or when pinged), alternating product bug/architecture sweeps with process hygiene audits, filing inbox tickets, pinging agents with `[PROMPT-UPDATED]` notices, and asking high-level questions in the `outbox/`.
- You can monitor their progress at any time by opening `.agents/workflows/developer-team/slack/general/team-dashboard.md`.
