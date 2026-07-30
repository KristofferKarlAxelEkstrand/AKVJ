---
name: team-agents
description: >-
  Compatibility guide for the AKVJ office-space co-worker team. Use when
  editing agent configs or prompts, changing CLIs/models, inspecting
  capabilities, or debugging office-space team startup.
---

# AKVJ Team Agents

The active team is `.agents/office-space/developer-team/` and is managed by the
installed `office-space` package.

## Route the task

- Team mission, lineup, capabilities, gates, or prompts: use `office-space-team-design`.
- CLI, model, reasoning, or cost assignment: use `model-chooser`, then `office-space models audit`.
- Mail, task transitions, Slack wakes, memory, or checkpoints: use `office-space-protocol`.
- Initial setup, upgrades, sync, doctor, or drift: use `office-space-onboard`.

## Configuration

Each resident co-worker has:

- `co-workers/<id>.prompt.json` — display name, CLI/model, enabled state, start mode, and capability flags.
- `co-workers/<id>.prompt.md` — narrow Own / Never / Incomplete Exit role instructions.

Pipeline authority comes from `lead`, `implementer`, `reviewer`, and `qa` flags—not agent names.
Exactly one enabled agent must have `lead: true`.

## Commands

```bash
office-space team roles developer-team
office-space models audit
office-space doctor
office-space check developer-team --tier fast
office-space team start developer-team
office-space team status developer-team
office-space team stop developer-team
```

Do not recreate or reference the retired custom supervisor.
