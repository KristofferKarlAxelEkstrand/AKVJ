# AKVJ Agent Workflows

This directory contains advanced, folder-based Kanban workflows for AI agents. Unlike the single-file scripts in the `prompts/` directory, these workflows are autonomous pipelines designed for long-term, multi-phase goals.

## How Workflows Operate

Each workflow has its own dedicated folder containing:
1. **The Prompt**: The core instructions for the agent.
2. **The Inbox**: A drop zone for your feature requests and bug reports.
3. **The Tasks**: The agent's generated queue of prioritized work.
4. **The Spec**: Overarching goals that the agent must strictly adhere to.
5. **The Memory**: The persistent ledger tracking the agent's progress across sessions.

To use a workflow, you simply drop a `.md` file into its `inbox/` directory and trigger the agent. The agent will read your request, convert it into discrete tasks, and begin executing them automatically.

---

## Active Workflows

To trigger any of these systems, copy the provided trigger text and paste it directly into your AI chat window.

### 👥 Developer Team
Autonomous, multi-agent development workflow (Team Lead, AKVJ Developer, Mainframe Developer, QA Reviewer, Overseer). See `developer-team/README.md` for how to start the team and assign work.

---

The Server Architect and MIDI MCP Developer workflows that used to live here have completed their founding missions — the `akvj`/`mainframe` monorepo split and the `midi-mcp` server both now exist as their own workspaces — and have been retired. Their origin specs are kept for historical reference at `.agents/prompts/specs/mainframe-and-akvj.prompt.md` and `.agents/prompts/archive/mcp-midi-protocol.prompt.md`; the Server Architect's iteration log lives at `developer-team/memory/archive/akvj-and-mainframe.memory.md`.
