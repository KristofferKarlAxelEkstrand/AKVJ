## Writing Messages

Every message file you write — into `.agents/workflows/developer-team/mail/in/` or any `.agents/workflows/developer-team/slack/<agent>/` — starts with this frontmatter block:

```yaml
---
type: <see table>
from: <your-agent-name>
to: <recipient-agent-name>   # omit for mail/in
task: <task-id>              # only when it relates to a specific task
re: <filename>               # only on an answer — the message you are replying to
created: <ISO-8601 timestamp>
---
```

The tooling reads this block: the dashboard shows real ownership from it, the stalled-work detector nudges the agent named in it, and broken envelopes are **repaired in place** by `validate-messages.js` (empty/unreadable files go to `.agents/workflows/developer-team/slack/quarantine/`). A message without valid frontmatter is invisible to the team's tooling until repaired.

Keep the `[PREFIX]-` filename convention too — that is how a human scans a folder at a glance.

| `type` | Typical route | Meaning | Filename |
| --- | --- | --- | --- |
| `task` | Team Lead → developer / QA | An assigned unit of work | `[TASK]-<id>-<slug>.md` |
| `report` | Developer → Team Lead | Work finished and self-verified | `[REPORT]-<id>-<slug>.md` |
| `blocked` | Developer → Team Lead | Self-healing exhausted; needs help | `[BLOCKED]-<slug>.md` |
| `feedback` | QA → developer | Small non-blocking fix noticed in passing | `[FEEDBACK]-<slug>.md` |
| `approved` | QA / machine-gate → Team Lead | Task verified, safe to archive | `[APPROVED]-<id>-<slug>.md` |
| `rejected` | QA / machine-gate → Team Lead | Task failed audit | `[REJECTED]-<id>-<slug>.md` |
| `question` | **any agent → any agent**, or → `mail/out/` for the human | Asking for context, a decision, or a second opinion | `[QUESTION]-<slug>.md` / `question-<slug>.md` |
| `answer` | **any agent → any agent** | Replying to a `question`; set `re:` to the file you are answering | `[ANSWER]-<slug>.md` |
| `handoff` | **any agent → any agent** | Passing a task to someone else — see the invariant below | `[HANDOFF]-<id>-<slug>.md` |
| `nit` | Nitpicker → `mail/in/` | Naming / readability finding | `[NIT]-<area>-<slug>.md` |
| `test` | Test Marshal → `mail/in/` | Coverage / flake / stale-test finding | `[TEST]-<area>-<slug>.md` |
| `deps` | Quartermaster → `mail/in/` | Dependency / lockfile / config finding | `[DEPS]-<focus>.md` |
| `review` | Human / Overseer → `mail/in/` | A batch of findings from reading a whole area | `[REVIEW]-<area>-<date>.md` |
| `npm-request` | Developer → Team Lead | Only Team Lead runs `npm install` | `[NPM-REQUEST]-<slug>.md` |
| `prompt-updated` | Overseer → `slack/all/` (shared) or `slack/<agent>/` (one prompt) | A file agents depend on changed | `[PROMPT-UPDATED]-<slug>.md` |
| `bug` / `feature` | Anyone → `mail/in/` | New work request | `[BUG]-` / `[FEATURE]-<slug>.md` |

## Talking to Each Other

**You may message any agent directly.** If you need context another implementer has, ask them —
`[QUESTION]` into their `slack/` folder, they reply with `[ANSWER]`. Routing a question through the
Team Lead costs four turns to move one fact, and the Team Lead has nothing to add to it.

Set `re: <filename>` in your `answer` so the thread is followable, and delete the question once you
have answered it.

### The task file is the truth

Peer traffic moves *attention*. It does not record state. Only the task file does:

- Handing work to someone else means editing `tasks/*/<id>-*.md` in the **same turn** — set
  `assignee`, set `status`, move it to the right kanban folder — and *then* sending the `handoff`.
- A `handoff` message with no matching task-file change is a protocol violation. QA rejects on it,
  because the dashboard, the stalled-work detector, and the human all read the task file, not your
  outbox.
- Never edit a task file to claim work that is already `in-progress` for someone else. Ask first.

Still centralized, and not negotiable between peers: only the Team Lead runs `npm install`, `[LOCK]`
still governs global commands, and the human still owns commits.

## Communication Style

Short and direct. Lead with the fact, bullets over prose, ~10 lines. Cut "I have completed…", "As requested…". Use code paths (`akvj/src/js/core/AppState.js`), not descriptions ("the state file"). If the reader can infer it, leave it out. A long message means something went wrong.
