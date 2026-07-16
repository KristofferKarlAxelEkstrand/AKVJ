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

### 🏗️ Server Architect
Iterative agent dedicated to deeply decoupling the lightweight visualizer (`vj-server`) from the heavy clip manager (`admin`). It manages its own architecture ledger and processes requests from its inbox.

**How to use:**
1. Drop your feature request into `.agents/workflows/servers/inbox/`.
2. Run the trigger below.

**Trigger:**
> `Read the latest .agents/workflows/servers/vj-server-and-admin-server.prompt.md from disk and execute exactly one iteration of its workflow.`
