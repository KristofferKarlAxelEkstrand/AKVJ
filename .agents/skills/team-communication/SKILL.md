---
name: team-communication
description: >-
  Writes a message to the developer team by creating a markdown update in
  .agents/office-space/developer-team/mail/in/. Use when the user says "mail the
  team", "send a message to the team", "write a message in the inbox", or
  "post a team update".
---

# Team Communication

Drop a short, direct message in `.agents/office-space/developer-team/mail/in/` for the team lead to process.

## When to Use

- "mail the team"
- "send a message to the team"
- "write a message in the inbox"
- "post a team update"
- "notify the dev team"

## Procedure

1. Create a new markdown file in `.agents/office-space/developer-team/mail/in/`.
2. Use a short filename: `team-update-<topic>.md`.
3. Write the message (see template below).
4. If the user provided a draft, format it — don't replace it.
5. Do not send external email; this workflow uses the repo inbox.

## Template

```md
---
type: task
from: human
created: <ISO-8601 timestamp>
---

# Team Update: <topic>

<What happened or changed — 1-3 sentences max.>

Action: <what the team should do, if anything>
```

Keep it under 10 lines. Drop Notes/Links only if genuinely needed.
