# AKVJ Multi-Agent Developer Team

This directory contains an autonomous, multi-agent development workflow. The team consists of **six core** AI agents plus **two optional** specialist roles that communicate asynchronously through a file-based "Slack" system and use an efficient Node.js polling script to wait for tasks without burning API tokens.

## How to Start the Team

Use the `run-team` script to start all agents automatically in tmux:

```bash
# List running teams
/workspaces/AKVJ/.agents/workflows/scripts/run-team --list

# Start developer-team workflow (interactive)
/workspaces/AKVJ/.agents/workflows/scripts/run-team

# Start specific workflow
/workspaces/AKVJ/.agents/workflows/scripts/run-team developer-team

# Restart specific agent
/workspaces/AKVJ/.agents/workflows/scripts/run-team --restart developer-team overseer

# Start health monitor
/workspaces/AKVJ/.agents/workflows/scripts/run-team --monitor developer-team
```

See [WORKFLOW.md](WORKFLOW.md) for detailed documentation.

## Agent Roles

### Core Agents

**1. Team Lead** - Central coordinator — triages inbox requests, breaks them into tasks, assigns work to developers, reviews reports, sequences QA reviews, and runs `npm install` on behalf of the team. The single source of truth for task status and the team dashboard.

**2. AKVJ Developer** - Implements features and fixes bugs in the `akvj/` visualizer — vanilla JS, 60fps canvas rendering, Web MIDI API. Runs lint and tests after every change, self-heals up to 3 times before escalating, and reports results to the Team Lead.

**3. Mainframe Developer** - Implements features and fixes bugs in the `mainframe/` application — clip management, image optimization, file scaling, and the MIDI key-map UI. Runs lint, tests, and the clip pipeline after every change, self-heals up to 3 times before escalating, and reports results to the Team Lead.

**4. QA Reviewer** - Audits completed developer work assigned by the Team Lead. Reviews only the scope of each task — checks code against the task's claims, verifies Vanilla JS / 60fps rules, and returns an `[APPROVED]` or `[REJECTED]` verdict. Does not run open-ended sweeps; that's the Overseer's job.

**5. Overseer** - Proactive product and process guardian — alternates between codebase bug/architecture sweeps and team process audits. Files inbox tickets for issues it finds, keeps specs and prompts current, and asks the human high-level questions. Wakes on a random 10–20 minute timer (or when pinged) so it never burns tokens sitting idle.

**6. Nitpicker** - Focused readability and naming steward — hunts misleading identifiers, inconsistent terminology, stale comments, and naming-convention violations. Files one batched `[NIT]` ticket per sweep to the inbox (never touches product source). Wakes on a random 15–30 minute timer (or when pinged); goes quiet when there is nothing to report.

### Optional Agents

**7. Test Marshal** - Test-coverage and quality specialist — hunts coverage gaps, flaky assertions, stale tests, and wrong-tier tests. Files `[TEST]` inbox tickets for developers to close; never writes tests itself and stays out of QA's per-task reviews. Wakes on a random 20–40 minute timer (or when pinged).

**8. Quartermaster** - Dependency and configuration hygiene specialist — audits `npm audit` advisories, version skew across workspaces, lockfile anomalies, dead npm scripts, and config inconsistencies. Files `[DEPS]` inbox tickets; runs only read-only diagnostics and never installs packages or edits `package.json`. Wakes on a random 30–60 minute timer (or when pinged).

## How to Assign Work

Once the agents are running, drop work into the inbox:

1. Create a markdown file (e.g., `feature-add-knob.md`)
2. Write your feature request or bug report
3. Save or move the file into `.agents/workflows/developer-team/inbox/`

### Epics

Large multi-task initiatives live in `epics/` with a `drafts/` / `todo/` / `done/` lifecycle:

- **`epics/drafts/`** - Work-in-progress ideas and proposals (humans or co-workers can iterate here)
- **`epics/todo/`** - Ready-to-implement epics that have been split into concrete tasks
- **`epics/done/`** - Completed or retired epics

The **Team Lead** is responsible for moving epics through this lifecycle.

**What happens next?**
- The **Team Lead** wakes instantly, reads the request, updates the dashboard, and assigns discrete tasks to the developers' slack folders
- The **AKVJ Developer** or **Mainframe Developer** wakes, implements the work, runs lint and tests, self-heals up to 3 times, and reports back
- The **QA Reviewer** wakes when the Team Lead drops a `[TASK]-review-*` file, audits the specific task's changes, and returns `[APPROVED]` / `[REJECTED]`
- The **Overseer** wakes every 10–20 minutes (or when pinged), alternating product bug/architecture sweeps with process hygiene audits
- The **Nitpicker** wakes on a timer (or when pinged) for focused naming/semantics/readability sweeps, filing tidy `[NIT]` inbox tickets
- *(optional)* The **Test Marshal** wakes on a timer (or when pinged) to hunt coverage gaps and flaky tests, filing `[TEST]` inbox tickets
- *(optional)* The **Quartermaster** wakes on a timer (or when pinged) to check outdated dependencies, `npm audit` advisories, lockfile hygiene, and dead scripts, filing `[DEPS]` inbox tickets

Monitor the team's progress at any time by opening `.agents/workflows/developer-team/slack/general/team-dashboard.md`.
