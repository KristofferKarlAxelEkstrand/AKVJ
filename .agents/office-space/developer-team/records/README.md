# Durable workflow records

This folder is the tracked continuity layer. Live mail, Slack, tasks, health, and memory logs are runtime state
and are ignored by Git.

| Folder         | Durable content                                                      |
| -------------- | -------------------------------------------------------------------- |
| `checkpoints/` | Restart state and exact resume actions for active or human-held work |
| `decisions/`   | Human product, gate, and workflow decisions                          |
| `memory/`      | Compacted lessons promoted from live per-agent memory                |
| `retros/`      | Workflow retrospectives and measured operating changes               |

Use `office-space state checkpoint developer-team` before maintenance or shutdown. A task entering `human`
or `blocked` receives its own checkpoint automatically. Once answered, promote the result into the relevant
canonical spec or evidence file and remove the resolved checkpoint in a normal reviewed change.

`office-space state compact developer-team` writes a pre-compaction checkpoint before applying this
workflow's configured retention values (see `space.json`).
