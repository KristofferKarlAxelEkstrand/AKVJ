---
name: team-communication
description: >-
  Writes a message to the developer team by creating a markdown update in
  .agents/workflows/developer-team/inbox/. Use when the user says "mail the
  team", "send a message to the team", "write a message in the inbox", or
  "post a team update".
---

# Team Communication

Use this skill when someone wants to notify the developer team about a status update,
an issue, or a request for follow-up.

## Goal

Create a concise, actionable markdown message in
`.agents/workflows/developer-team/inbox/` and leave it ready for the workflow
agents to process.

## When to Use This Skill

- "mail the team"
- "send a message to the team"
- "write a message in the inbox"
- "post a team update"
- "notify the dev team"

## Procedure

1. Create a new markdown file in `.agents/workflows/developer-team/inbox/`.
2. Use a short, descriptive filename such as `team-update-npm-install.md`.
3. Write the message in this structure:
   - `# Team Update: <short topic>`
   - a brief summary of what happened
   - the impact or context
   - any action the team should take
   - supporting notes, logs, or links if useful
4. Keep the message factual, concise, and easy to scan.
5. If the user already provided a draft, preserve it and format it into the inbox message rather than replacing it.
6. Do not try to send an external email directly; this workflow uses the repository inbox.

## Template

```md
# Team Update: <topic>

## Summary
<what happened or changed>

## Impact
<who or what is affected>

## Action Needed
<what the team should do, if anything>

## Notes
<links, logs, or additional context>
```
