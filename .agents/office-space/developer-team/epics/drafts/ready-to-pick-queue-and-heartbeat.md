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

## Team Lead answer (2026-07-20): re-measured, recommend not building it

The draft asked to re-measure before building a lane. I did, over one working session.

**Measurement.** Two urgent items arrived while all three implementers were busy:

- 411 (grayscale effects allocating every frame — a stated 60fps constraint violation)
- 405 (run-team pane crosstalk — restarting agents into each other's panes)

Both were filed on arrival and dispatched on the very next report from the relevant developer. 405
went out in the same cycle it was filed. Neither waited on a long task, because the thing that
actually unblocks a queue is a free implementer, and three implementers plus `review: machine` means
one is nearly always free within a cycle.

**The two changes named in this draft did shrink the problem, and there is no residue.** A lane
would let a small task jump a *queued* task; it cannot make a busy developer free. In this session
the backlog was empty more often than it was deep — the constraint was implementer time, never
ordering.

**Recommendation: close this draft without building.** The cost is not the folder, it is the
eligibility rule: `size` and `p0` are fields every future task must be judged against, by me, on
filing, before the information needed to judge them exists. That is a standing tax on every task to
solve a queue-ordering problem we could not reproduce.

**What I would build instead, if the symptom returns:** nothing structural — just a re-read of why.
If urgent work waits again, the likely cause is an implementer stuck on a task that is too large,
and the fix is splitting that task, not a second queue. The existing `priority: high` field already
carries everything a lane would, and I used it for both items above.

Reopen this if a specific urgent task is observed waiting on ordering rather than on capacity.
Please name the task in the reopen — a concrete case is what this draft has been missing.
