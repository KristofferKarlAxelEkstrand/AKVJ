# Ready-to-pick queue (fast lane)

## Source

Human workflow feedback (2026-07-20) and Overseer `[FEATURE]-ready-to-pick-queue-and-heartbeat.md`.

## Already solved — the stalled-work half

This draft originally paired the fast lane with "in-progress tasks can stall silently". That half
shipped on 2026-07-20 and is out of scope here:

- `detect-stalled-work.js` nudges the agent named in a stalled item's own frontmatter, once per item.
- The monitor records `down` / `restart` / `recovered` / `flap` to `health/uptime.log` and keeps an
  alert file per down agent in `health/alerts/`.
- `npm run agents:status` answers "is anyone stuck or gone?" in under a second, and the dashboard
  carries a Team Health banner.

## The open problem

A one-liner CI fix queues behind a long project-review task when both developers already hold a
`[TASK]`. There is one backlog and it is strictly ordered by the Team Lead's judgement, so small
urgent work waits on large slow work.

Note that two things have changed since this was written and may shrink the problem:

- A third implementer (**Utility Developer**) now takes cross-cutting work, which is where most CI
  and config one-liners land.
- `review: machine` tasks no longer queue behind QA, so the tail of a small task is much shorter.

Re-measure before building a lane: the fix may already be in.

## Design questions for Team Lead / Overseer

- What makes a task eligible for the fast lane? (`priority: p0`, `size: one-liner`, CI-only fixes?)
- How does the lane interact with `tasks/todo/` and the dashboard — a field, or a separate folder?
- Does a developer holding a long task get interrupted, or does the lane only apply at pick time?
- Which pieces belong in `spec/process/collaboration-protocol.md` vs. the Team Lead prompt?

## Candidate deliverables

- A `size` or `p0` field in task frontmatter, plus a documented eligibility rule.
- A ready-to-pick section on the dashboard, or a `tasks/ready/` lane.
- Dispatch rule: free implementers pull from the lane before the main backlog.
