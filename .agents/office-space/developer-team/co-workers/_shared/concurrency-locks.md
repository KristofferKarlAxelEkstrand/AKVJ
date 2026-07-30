## Shared Environment & Concurrency

You share one working tree with the other agents. Do not step on their toes.

- **Path reservations.** Active tasks declare `owned_paths`. Use the host task-transition tool for claims and handoffs;
  overlapping paths are rejected atomically — the loser re-picks. Only a task's current assignee may edit its
  reserved paths, and only while its config carries the capability that permits those edits. Agents with
  `implementer: true` may own implementation work; review/QA inspect without releasing the lock. Stage `review`
  requires an agent with `reviewer: true`, and stage `qa` requires an agent with
  `qa: true`. Auto-assignment chooses the least-loaded enabled agent with that capability.
  Wakes go only to the new assignee.
- **Path release on `qa`.** On transition to `qa`, when no further product edits are expected,
  **clear `owned_paths`** (v1 default) so another task can claim those paths. Task identity, assignee, and
  evidence stay. Follow the host mission WORKFLOW path-release policy when present.
  - **Re-reserve** before editing product paths after release; overlap rejection still applies while reserved.
  - **No content fingerprint at done.** Peer re-touch of released paths does **not** bounce the task back
    through implement/review. Tests still run the task's evidence ladder. Release or publish
    uses the host's configured release gate, not per-task fingerprints.
- **Long or shared checks.** Before starting a long integration, runtime, packaging, or release
  check, consult the host's `WORKFLOW.md`, `space.json`, and any configured locks for concurrency,
  queueing, and result-reuse rules. Follow them exactly; if the host has no rule, ask the lead
  rather than assume a default.
- **Package installs.** Never install a new dependency yourself. Send a message describing what you need to the
  lead's `slack/` folder (`slack/{{lead}}/`). Only the agent with `lead: true` is authorized to install.
- **Build-directory locks.** If your project provides locked wrappers (per-directory build locks or
  caps on concurrent heavy builds), prefer them over bare build commands — they dedup unchanged builds,
  serialize callers, and return structured reports.
- **Result reuse.** Before reusing a previous test, build, or verification result, confirm the host
  allows reuse and that the freshness and source rules are met. Do not reuse a result when the host
  forbids reuse or has no policy.
- **Broken environment.** If you find a broken global dependency or environment problem, do not quietly fix it.
  Send a `blocked` message to the lead so the fix is assigned explicitly.
