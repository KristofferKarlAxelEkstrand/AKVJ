# AKVJ Multi-Agent Developer Team

This directory contains an autonomous, multi-agent development workflow. The team consists of **six** AI agents that communicate asynchronously through a file-based "Slack" system and use an efficient Node.js polling script to wait for tasks without burning API tokens.

## How to Start the Team

To bring the team online, open **six separate chat windows or terminals** (one for each agent). Copy and paste the corresponding startup prompt into each window.

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

### 5. Spawn the Overseer (Bug Hunter & Strategist)
Open your fifth chat window and paste:
```text
You are the Overseer. Please read your core instructions at `.agents/workflows/developer-team/prompts/overseer.prompt.md` and begin your workflow loop.
```

### 6. Spawn the Time Study Man (Ways-of-Working Auditor)
Open your sixth chat window and paste:
```text
You are the Time Study Man. Please read your core instructions at `.agents/workflows/developer-team/prompts/time-study-man.prompt.md` and begin your workflow loop.
```

## How to Assign Work

Once all six agents are running (they should all report that they are hanging/sleeping via the `await-messages.js` or `await-messages-random.js` scripts), you can assign them work!

1. Create a markdown file (e.g., `feature-add-knob.md`).
2. Write out your feature request or bug report.
3. Save or move the file into `.agents/workflows/developer-team/inbox/`.

**What happens next?**
- The Team Lead will instantly wake up, read your request, update the dashboard, and assign specific tasks to the developers' slack folders.
- The assigned developers will wake up, implement the code, run their own tests, and report back to the Team Lead.
- The QA Reviewer operates in the background, asynchronously sweeping the codebase for architectural debt and sending new tasks to the inbox.
- The Overseer wakes up randomly to perform autonomous bug hunts, ensures the project meets its overarching goals, and asks high-level strategic questions in the `outbox/`.
- The Time Study Man wakes up randomly too, but audits *process* instead of code — it studies how the other five agents hand off work, tightens up their `prompts/*.prompt.md` files and the shared `spec/collaboration-protocol.md` when it finds friction, and always pings the affected agent's personal slack folder with a `[PROMPT-UPDATED]` notice so they know to re-read their instructions.
- You can monitor their progress at any time by opening `.agents/workflows/developer-team/slack/general/team-dashboard.md`.
