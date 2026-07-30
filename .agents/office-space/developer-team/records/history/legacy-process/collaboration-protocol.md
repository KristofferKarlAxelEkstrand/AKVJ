---
id: collaboration-protocol
title: Collaboration Protocol
status: approved
owner: human
maintainer: overseer
approved: 2026-07-20
verified: 2026-07-29
---

# Collaboration Protocol (Ways of Working)

This is the canonical reference for *how* the developer team collaborates through the file-based system — the message conventions, mailbox rules, and hygiene that keep the asynchronous agents (seven core + three optional specialists) from stepping on each other. It is owned and kept current by the **Overseer**; every other agent should follow it, but only the Overseer edits it (propose changes via a `mail/out/` question or by flagging process friction in `slack/overseer/`).

> **Path convention:** All mailbox, task, and workflow paths in this document are relative to `.agents/workflows/developer-team/` (the workflow root). When running commands or writing files from the repo root, expand them to `.agents/workflows/developer-team/<path>`.

This file is about *process*. Code standards live in the repo-root `AGENTS.md` (the single source of truth for how code is written); what the product does lives in the specs indexed by `.agents/workflows/developer-team/spec/README.md`. Those are **human-owned**: the human approves them, the Overseer may correct facts in them, and nobody else writes there. Only an `approved` spec is binding.

## The Mailboxes

| Folder | Who writes | Who reads | Purpose |
| --- | --- | --- | --- |
| `mail/in/` | Human, Overseer (bug/architecture tickets from sweeps) | Team Lead | New feature requests / bug reports. Moved to `mail/in/read/` once triaged. |
| `drafts/` | Human (agents when invited) | Human | Human scratchpad for feature specs still being written. Not yet ready for Team Lead triage — nothing moves out of here into `mail/in/` except the human. Agents may help here if the human explicitly directs them to. |
| `mail/out/` | Any agent | Human | Questions that need a human **decision**. Strict `Question:` / `Answer:` format; delete once the answer is internalized. Nothing else belongs here — status dumps and reports have no owner to delete them, so they accumulate in the human's queue and re-wake the Overseer (who watches this folder for answers) for something it has no rule to act on. |
| `health/reports/` | `health-report.js` (the monitor) | Human / Overseer (on demand) | Team-health snapshots, rewritten every monitor pass. Transient and self-pruning to the newest three — observation only, never a request for a decision. |
| `tasks/todo/` | Team Lead | Team Lead | Filed backlog — tasks not yet picked up. |
| `tasks/working-on/` | Team Lead | Team Lead, developers | Actively in-progress tasks. Moved here from `tasks/todo/` when assigned. |
| `tasks/done/` | archive-task.js | — | Completed and QA-approved tasks. |
| `epics/` | Team Lead, Overseer | Team Lead, developers (when assigned a related task) | Large, multi-task initiatives with a three-stage lifecycle: `epics/drafts/` (idea dumps and WIP epics the team is shaping), `epics/todo/` (ready-to-implement epics broken into tasks), `epics/done/` (completed or retired). Agents work freely in all three subdirs. |
| `slack/all/` | Overseer, human | Everyone — every poller watches it | The broadcast channel. One file wakes the whole team, so it is for prompt/protocol changes and freezes, nothing else. **Readers do not delete**; the author prunes. See `slack/all/README.md`. |
| `slack/<agent-name>/` | Any agent | That agent only | A personal mailbox/PM inbox. This is where `[TASK]`, `[REPORT]`, `[BLOCKED]`, `[FEEDBACK]`, `[APPROVED]`, `[REJECTED]`, and `[PROMPT-UPDATED]` files are dropped for a specific recipient. |
| `slack/quarantine/` | Any agent | Overseer / Human | The dead-letter queue. If an agent crashes or hits an unrecoverable error reading a file, they move the file here to avoid infinite loops. |
| `slack/general/` | Any agent | Everyone (by convention, not automatic) | Shared artifacts: the team dashboard, team-wide guideline notes, and `[LOCK]` files for exclusive access to global commands (`npm install`, root `package.json` edits). |

## Message Prefix Conventions

| Prefix | From → To | Meaning |
| --- | --- | --- |
| `[TASK]` | Team Lead → a developer | An assigned unit of work. |
| `[FEEDBACK]` | QA Reviewer → a developer | A small, non-blocking fix noticed in passing. |
| `[NIT]` | Nitpicker → `mail/in/` | A naming/semantics/readability finding (usually one batched checklist per sweep) for the Team Lead to triage into a task. |
| `[TEST]` | Test Marshal → `mail/in/` | A test-coverage gap / flaky / stale-test finding (usually one batched checklist per sweep) for the Team Lead to triage into a task. |
| `[DEPS]` | Quartermaster → `mail/in/` | A dependency / lockfile / version-skew / config-hygiene finding for the Team Lead to triage (flag anything needing `[NPM-REQUEST]` / `[LOCK]`). |
| `[REVIEW]` | Human or Overseer → `mail/in/` | A batch of findings from reading a whole area, for the Team Lead to split into tasks. |
| `[BUG]` | Anyone → `mail/in/` | Product bug. Field Tester tickets carry the command, real output, and narrowest repro; Overseer/QA may file from inspection. |
| `[FEATURE]` | Anyone → `mail/in/` | New capability request (not a bug). |
| `[APPROVED]` / `[REJECTED]` | `machine-gate` → Team Lead | A `review: machine` task verified by `machine-review.js` rather than by QA. |
| `[REPORT]` | Developer → Team Lead | Work finished, self-verified, ready for QA. |
| `[BLOCKED]` | Developer → Team Lead | Self-healing attempts exhausted; needs help. |
| `[APPROVED]-<task-id>` | QA Reviewer → Team Lead | Task verified; safe to move to `tasks/done/`. |
| `[REJECTED]-<task-id>` | QA Reviewer → Team Lead | Task failed audit; moved back to `tasks/todo/`, follow-up ticket filed in `mail/in/`. |
| `[NPM-REQUEST]` | Developer → Team Lead | Only the Team Lead runs `npm install`; developers request it here. |
| `[LOCK]` | Developer → `slack/general/` | Exclusive claim on a destructive/global command (e.g. root `package.json` edits, global builds). **Not** for `npm install` — use `[NPM-REQUEST]` for that. Delete when done. |
| `[PROMPT-UPDATED]-<slug>` | Overseer → `slack/all/` (shared) or `slack/<agent>/` (one prompt) | A file agents depend on changed on disk. See below. |
| `[QUESTION]` | Any agent → any agent (or `mail/out/` for the human) | Asking for context, a decision, or a second opinion. |
| `[ANSWER]` | Any agent → any agent | Replying to a `[QUESTION]`; carries `re:` naming the file it answers. |
| `[HANDOFF]` | Any agent → any agent | Passing a task on. Only valid alongside a task-file edit — see "Talking To Each Other". |
| `[AWAITING-APPROVAL]-<task-id>` | Developer → Team Lead | A task explicitly required human plan-approval before implementation; the developer submitted its plan to `mail/out/` and is correctly blocked, not implementing. Carries `type: blocked` in its envelope — there is no separate type for it. See "Plan-Approval Gate" below. |

## Talking To Each Other

**Any agent may message any other agent directly**, with any message type. Routing a question
through the Team Lead cost four turns to move one fact, and the Team Lead had nothing to add to it.

- `question` → `answer` between peers, with `re: <filename>` on the answer so the exchange can be
  followed afterwards.
- `handoff` passes a task to someone else.

### The task file is the truth

Peer traffic moves *attention*. It does not record state — only `tasks/*/<id>-*.md` does.

- A handoff means editing the task file in the **same turn**: set `assignee`, set `status`, move it
  to the right kanban folder. Then send the `handoff`.
- **A handoff with no matching task-file change is a protocol violation**, and QA rejects on it. The
  dashboard, the stalled-work detector, and the human all read the task file. If it disagrees with
  who is actually working, everything downstream is wrong.
- Never take a task that is `in-progress` for someone else without asking them first.

Still centralized, and not a peer's to negotiate: only the Team Lead runs `npm install`, `[LOCK]`
governs global commands, and the human owns commits.

## Review Routing

Not every task needs a reviewer with judgement, and pretending otherwise is what turned QA into
this team's bottleneck — the sweep log records a twenty-plus backlog while the reviewer worked
through rename sweeps one at a time.

- **`review: human`** (the default; omit the field) — the QA Reviewer reads it. Anything that
  changes behaviour a user could observe.
- **`review: machine`** — `machine-review.js` runs lint, tests, and `agents:check`, then writes the
  same `approved` / `rejected` message QA would. Only for formatting, renames, comment/JSDoc edits,
  test-only additions, and pre-validated dependency bumps.

The Team Lead sets this **when filing the task**, never after the report arrives. Deciding a task
needs no review once you can see how it turned out is how a bad change talks its way past the gate.
The machine gate proves the suite is green; it cannot tell you the change was a good idea.

## Guard Rails (enforced, not requested)

Every agent runs with permissions bypassed, so the rules below are the ones that do not depend on
an agent remembering them. `.githooks/` is armed by `run-team` at startup (`core.hooksPath`), and
refuses:

- any `git push`
- committing `.env`, keys, or a staged diff containing something shaped like a live credential
- committing `run-team`, `await-messages.js`, `control-center`, or `.github/workflows/`
- committing binary assets

The human overrides any of it with `HUMAN=1`. If a hook blocks you, that is the answer — do
not work around it, and do not disable the hook. Escalate through `mail/out/` instead.

## The Golden Hygiene Rule

**Always delete or move a message file once you've acted on it.** A file left sitting in your personal `slack/` folder looks like unread mail on your next wakeup and will re-trigger you (or, worse, be silently re-processed). Every prompt's workflow loop ends with an explicit cleanup step for exactly this reason — it is not optional.

## The Sleep Step (background execution — do not let it end your session)

Every role ends its loop by running the blocking `await-messages.js` script. Two failure modes have both been observed in practice — one strongly suspected as the real cause of the ~11.5-hour QA Reviewer stall on 2026-07-18, the other confirmed live on the Nitpicker the same day — and both produce the same silent symptom: the agent looks "asleep" but is actually gone, and nothing arrives to wake it.

**Rule — always invoke the sleep command as a background task, then immediately end your turn:**

1. **Run it in the background, never in the foreground.** `await-messages.js` blocks until a file arrives. Roles with `min_wait_minutes`/`max_wait_minutes` set (Overseer, Nitpicker, Test Marshal, Quartermaster, Field Tester) also wake on their own random sweep window (10–60 minutes depending on role); every other role gets a slow safety-net wake (~60 min, `fallback_wake_minutes`) so a missed message can never leave it unreachable forever. If you run it in the foreground, the harness's own tool-call timeout can silently kill the command before a real message ever arrives — you get back a killed/timed-out result, not a clean wake, and your loop desyncs from a stuck-but-invisible state. Use your tool's background-execution option so the command keeps running independently of the current turn.
2. **The instant you've started it in the background, stop.** End your turn with nothing more than a short one-line acknowledgment (or nothing at all) — no further tool calls, no extra sweeping, no "while I'm waiting, let me also check X." Ending the turn is what actually puts the session into an idle, waiting state. If you keep working after starting the background sleep, you were never actually asleep, and this defeats the entire point of the step.
3. **Ending your turn is not ending your session.** The two are different things. Do not `exit 0`/terminate your process here — that's reserved for the `[PROMPT-UPDATED]` self-restart flow (see below). The background task's own completion (new file or timeout) is what the harness uses to resume this same session back at Step 1, automatically. You do not need to, and must not try to, cause that resumption yourself.
4. **If the sleep command ever comes back as an error, kill, abort, or timeout instead of a clean "message waiting" / "random sweep triggered" result, that is not a real event.** Do not treat it as license to do unrelated work or skip sleeping. Just immediately re-invoke the identical sleep command in the background and end your turn again. Observed live on 2026-07-18: the Cursor harness sometimes **aborts** a correctly backgrounded sleep after only a few seconds (status `aborted` / `exit_code: unknown`) even though no message arrived — same recovery: re-invoke + end turn. Do not "give up" after repeated aborts; that is how a role silently leaves the await state the human expects.

### Why the Golden Hygiene Rule is load-bearing for wakes

The poller records a message as "seen" the moment it spots it — *before* your turn has read anything. If that turn dies, a write-once mark would bury the message forever. So an unchanged file that is still sitting in a mailbox gets **one** extra wake on the next poll cycle, on the assumption that a file left in place was never handled.

That recovery only works because handled files get deleted or moved. Leaving an acted-on file in your mailbox doesn't just look like unread mail — it spends the one retry that exists to rescue genuinely dropped work. (`mail/out/` is exempt: a question legitimately waits there for a human, and the answer edit wakes the Overseer on its own.)

### Agent restart hygiene (duplicate pollers)

Restarting an agent chat does **not** automatically kill that role's previous `await-messages.js` process. If the old session never exited cleanly, its poller keeps watching the same mailbox. Observed live on 2026-07-18: duplicate pollers on `akvj-developer`, `mainframe-developer`, and `team-lead` at the same time (and earlier, overlapping Overseer sessions writing `sweep-log.md` concurrently).

**Symptom (historical):** one new file woke more than one session for the same role — double-processing, log races, and worst of all a "zombie" poller that kept rewriting `health/heartbeats/<agent>.json`. The monitor reads that file's age as proof of life, so a session that was actually gone looked alive indefinitely and was never restarted. That is the shape of the ~11.5-hour stall above.

**This is now handled automatically.** Each poller claims `.temp/.await-lock-<agent>.json` at startup; an older incarnation sees a pid that is not its own on its next tick (~2s) and exits without touching the heartbeat. The monitor additionally checks that the pid in a heartbeat is still alive, so a fresh-looking heartbeat from a dead process no longer masks a death. Nothing kills anything, and a legitimate restart is never refused — the newest poller simply wins.

**Human:** no `ps aux | rg await-messages` step before a restart any more. If you are curious, the lock file names the owning pid.

**Agents:** unchanged — follow the sleep step in *your* session. Seeing another poller on your mailbox is not a reason to skip sleeping; it will stand down on its own.


## Workflow retention / idle cleanup

Processed mail piles up (`mail/in/read/`, answered `mail/out/`, stuck slack files). Durable truth belongs in `spec/`; ephemeral files should not live forever. Full playbook: **`routine-maintenance.md`** (Workflow hygiene). The **Overseer** runs this on process/idle wakes when the team is quiet — promote lasting facts into specs, then delete leftovers (no second archive tree).

| Area | Rule |
| --- | --- |
| `mail/in/` | Active only; after triage → `mail/in/read/`. |
| `mail/in/read/` | Cold. On idle cleanup: promote lasting intent to `spec/` if missing, then delete older read mail (keep roughly the newest ~20). |
| `mail/out/` | Delete once answered and internalized; obsolete status dumps → delete or one-line note to human. |
| `slack/*/` | Empty after act; purge stale files; remove dead role folders. |
| `slack/general/` | Only `team-dashboard.md` and active `[LOCK]` files. |
| `memory/*/` | Logs OK; summarize/trim when huge; archive folders are historical — do not re-read every sweep. |
| `tasks/done/` | Keep as completion record; idle cleanup focuses on mail/slack first. |
| `health/reports/` | Snapshots. `health-report.js` keeps the newest three and deletes the rest itself. |

## Prompt Shape (so a difference reads as a choice, not drift)

Every role prompt has frontmatter declaring its `partials:`, a one-paragraph statement of what it
owns, and a `## Your Loop` section. Inside the loop, two forms are both correct and the choice is
made by length:

- **A numbered list** (`1. **Read …**`) when each step is one line — the developers, the
  report-only specialists.
- **`### N. Title` sub-headings** when steps carry paragraphs, code blocks, or sub-rules — Team
  Lead, Overseer, QA Reviewer.

Do not convert one into the other for tidiness. A long loop crammed into list items is harder to
follow, and that is the only thing this convention is protecting.

Cross-cutting rules never live in a role prompt: they go in `co-workers/_shared/` and are opted
into via `partials:`. A rule restated in an individual prompt is drift — move it to the partial.

## The Prompt-Drift Problem (why the Overseer watches process)

Every agent's workflow loop re-checks its mailbox on each wakeup, but it does **not** re-read its own `co-workers/*.prompt.md` file from disk unless told to. A prompt file can be edited mid-flight and the running agent will keep following the stale version it already has in context, silently drifting out of sync with the process.

**Rule**: any time a `co-workers/*.prompt.md` file (or a `co-workers/_shared/` partial, or another file an agent's loop depends on, e.g. this protocol doc) is edited:
1. The editor drops a `[PROMPT-UPDATED]-<slug>.md` naming the exact file and summarizing what changed.
2. **Shared** change (`_shared/` partial, this protocol, `AGENTS.md`) → **`slack/all/`** (one file; every poller watches it). **One agent's** prompt only → that agent's personal `slack/<agent-name>/`.
3. Never hand-copy the same notice into a list of personal folders — that list goes stale.
4. The receiving agent's first workflow step ("check messages") will surface it. The agent must **delete the notice and gracefully exit their loop (`exit 0`)**. They will automatically be restarted with the fresh prompt in their system context.

## Plan-Approval Gate

Some tasks explicitly ask a developer to share a plan and wait for the human's approval before writing code (e.g. "please share a brief plan before building so we can align"). The human has confirmed (2026-07-17): when a task asks for this, **the team must actually wait** — not proceed after some elapsed time with a best guess. This happened once (Task 92 shipped ~42 minutes after its plan was submitted, with no answer ever received) and produced a real rework cost, so this is now a hard rule, not a judgment call.

Neither Team Lead nor the developers read `mail/out/` — only the Overseer polls it. So the gate is enforced via the normal mailbox path instead of an outbox read:

1. **Developer**: if a task's own text explicitly asks you to share a plan and wait for approval before building, do **not** implement. Write the plan to `.agents/workflows/developer-team/mail/out/question-<task-id>-<slug>.md` in `Question:` / `Answer:` format, send an `[AWAITING-APPROVAL]-<task-id>.md` message to `.agents/workflows/developer-team/slack/team-lead/`, and sleep. Only start once you receive a genuinely fresh `task` for it — that is what approval looks like. Never proceed on a timeout or a guess. This is a hard rule: a task once shipped 42 minutes after its plan went out with no answer ever received, and the rework cost was real. Do not touch the code for that task until then.
2. **Team Lead**: on receiving `[AWAITING-APPROVAL]-<task-id>`, do **not** reassign or re-dispatch that task — leave it blocked. Delete the notice only once you send a genuinely fresh `[TASK]` for it (which will only happen after the plan was actually approved).
3. **Overseer**: since I'm the one who actually sees `mail/out/` answers, once a gated plan gets a filled-in `Answer:` block, I file the approved direction as a normal ticket into `mail/in/` (same as any other finding) so Team Lead's regular loop picks it up and dispatches a real, approved `[TASK]`. I do not reassign work directly — that stays Team Lead's job.

## Reporting When You Are Awaiting

If you are idle because you are waiting on another agent or a human, publish an awaiting status so the health monitor and your teammates can see the blockage. Do **not** invent busywork or silently time out.

```bash
node .agents/workflows/scripts/post-awaiting.js developer-team <your-agent-name> "<waiting-on>[, ...]" "<short reason>"
```

Examples:

- `node .agents/workflows/scripts/post-awaiting.js developer-team akvj-developer "team-lead" "waiting for next task assignment"`
- `node .agents/workflows/scripts/post-awaiting.js developer-team qa-reviewer "human" "awaiting answer to outbox question about expected behavior"`

`await-messages.js` clears this status automatically when a new message wakes you. Clear it manually with `--clear` if you no longer need it:

```bash
node .agents/workflows/scripts/post-awaiting.js developer-team <your-agent-name> --clear
```

The heartbeat file `health/heartbeats/<agent>.json` is written by `await-messages.js` every 30 seconds while the agent is **asleep** waiting for mail. The health monitor does **not** restart on staleness alone: a stale (or dead-pid) heartbeat plus a live CLI in the pane means the agent is mid-turn and is left alone until a hung threshold; only a confirmed bare shell (or past-hung CLI) triggers an auto-restart. Status tools treat a dead poller pid with the session still up as mid-turn (`busy`), not `DOWN`.

## Git & Commits (the human owns commits)

The human owns commits. Agents change files and **leave them in the working tree** for the human to review and commit — making an edit is not the same as committing it.

- **Do not `git add`/`git commit`/`git push`** as part of finishing a task. Default to leaving your edits uncommitted. Only stage/commit when the human explicitly asks in the current request, and even then keep it surgical (`git add <specific paths>`, never `-A`/`.`).
- **Never** stage or commit binary assets (e.g. PNG sprite sheets) or tracking-/history-altering operations (retiring tracked directories, large migrations/renames, `.gitignore` policy changes) on your own — these always wait for the human.
- If a change only becomes durable once committed (e.g. a migration a fresh clone depends on), **escalate via `mail/out/`**: state exactly what would be staged/removed and let the human commit it. Do not silently delegate the commit to another agent.
- Read-only git (`git status`, `git diff`, `git log`, `git ls-files`) is always fine for gathering evidence. Full rules live in the `git-safety` skill.

## Scope Boundaries

- The Overseer edits *process* files: `co-workers/*.prompt.md` and `co-workers/_shared/*.md` (with the notify rule above), and this file.
- In the *product specs* the Overseer is maintainer, not author: it may correct a fact that shipped behaviour has outrun (logging it in that spec's changelog and bumping `verified:`), but never changes intent and never approves a spec. Intent is a `mail/out/` question for the human. Code standards live in the repo-root `AGENTS.md`.
- Everyone else proposes product changes in `epics/drafts/` and never writes to `spec/`.
- The Overseer does **not** edit product source code, `tasks/*`, or `slack/general/team-dashboard.md` — those belong to the Team Lead, developers, and QA Reviewer.
- The **Nitpicker** is a proactive, timer-driven role (like the Overseer) but scoped to *how the code reads*: naming conventions, semantics, terminology consistency, and small code-quality/readability nits. It **files `[NIT]` tickets into `mail/in/`** and never edits product source, `tasks/*`, the dashboard, prompts, or the specs. Bugs/perf/architecture stay with the Overseer; task verification stays with QA. Overseer and Nitpicker appear on the dashboard **Team Health** banner only — not under In Progress / Pending QA (they own no implementer tasks).
- The **Utility Developer** implements everything outside `akvj/` and `mainframe/`: root config, `monorepo-scripts/`, `.agents/workflows/scripts/`, `.github/workflows/`, e2e/smoke tiers, and any sweep that spans both workspaces. Before it existed, that work either landed on a workspace developer in violation of their own scope rule or sat unassigned — 31 completed tasks carry `assignee: none`.
- The **Field Tester** is timer-driven and report-only like the other specialists, but finds bugs by **running** things — suites, the clip pipeline, the mainframe API — rather than by reading code. Every finding carries the command and the real output. It never fixes anything.
- The **Test Marshal** (Coverage Hawk) and the **Quartermaster** are **optional**, timer-driven, report-only specialists that may not always be running. Both **file tickets into `mail/in/`** and never edit product source, tests, config, `tasks/*`, the dashboard, prompts, or specs. When enabled they show on the Team Health banner; they do not hold In Progress implementer tasks.
  - **Test Marshal** owns systemic test health: coverage gaps, untested modules, flaky/stale tests, test duplication (`[TEST]` tickets). This is distinct from QA, which verifies specific assigned `[TASK]-review-*` work — the Test Marshal is proactive and systemic, QA is per-task and event-driven.
  - **Quartermaster** owns the supply lines: outdated deps, `npm audit`, version skew, lockfile hygiene, and config/script/`engines` health (`[DEPS]` tickets). It runs only **read-only** diagnostics (`npm outdated`, `npm audit`, `npm ls`) and never runs `npm install`/`audit fix` or edits `package.json`/the lockfile — those changes go through a Team-Lead-sequenced task (via `[NPM-REQUEST]` / `[LOCK]`). Config overlaps with the Overseer; deps/lockfile are the Quartermaster's.
- Disagreements about process (e.g. "should old `[REPORT]` files in `slack/general/` be deleted or kept as an archive?") are a good candidate for a `mail/out/` question rather than a unilateral rewrite.

## Changelog

- 2026-07-29 — Process re-verify: corrected Scope Boundaries dashboard wording — Team Health includes report-only roles; In Progress / Pending QA stay implementer-only (was “not on the dashboard”).
- 2026-07-29 — `[BUG]` / `[FEATURE]` rows: route is **Anyone → `mail/in/`** (matches `_shared/messaging.md`). Field Tester still prefers command+output repros; Overseer/QA may file bugs from inspection.

- 2026-07-29 — Plan-Approval Gate Overseer step: `## Answer` → bare `Answer:` to match `_shared/messaging.md` and live `mail/out/` format.

- 2026-07-29 — Re-verified against `co-workers/*.prompt.md` + `_shared/` partials after ~9d idle. Paths (`mail/in|out`, `tasks/{todo,working-on,done}`, `slack/all`), sleep-step, mailbox hygiene, and message types still match. No wording change.

- 2026-07-20 — **Plan-Approval Gate wording moved to a shared partial.** The developer-side rule now lives once in `co-workers/_shared/plan-approval.md` and is included by the AKVJ, Mainframe, and Utility developer prompts. The protocol text was aligned to use the same path pattern, `Question:` / `Answer:` format, and historical note so prompts and protocol stay in sync.

- 2026-07-20 — **Busy vs dead in status tools.** Dead poller pid with session up is mid-turn
  (`busy`), not `DOWN`. `--ensure` starts detached (no attach) for cron. Overseer
  `prompt-updated` routing matches `slack/all/` for shared edits. Message validation is a real
  non-mutating gate under `agents:check`.

- 2026-07-20 — **Intercommunication and uptime.** Peers may now message each other directly
  (`question` / `answer` / `handoff`), with the task file as the single source of ownership truth.
  Added the `slack/all/` broadcast channel, watched by every poller, replacing the hand-copied
  prompt-updated fan-out. Retired the Health Inspector agent in favour of `health-report.js` (an LLM
  was spending a turn every 40 minutes on arithmetic). Added `npm run agents:status`, an append-only
  `health/uptime.log`, `health/alerts/`, a Team Health banner on the dashboard, flap escalation that
  stops restarting an agent that will not stay up and asks the human instead, and
  `run-team --ensure` for cron.

- 2026-07-20 — **Duplicate pollers fixed at the root.** Pollers now claim a pid lock and older
  incarnations stand down within ~2s; the monitor checks pid liveness instead of trusting heartbeat
  age alone. A zombie poller can no longer keep a dead session looking alive. The manual
  kill-the-orphan step before a restart is gone.

- 2026-07-20 — **Capacity and guard rails.** Added the **Utility Developer** (owns everything
  outside the two workspaces) and the **Field Tester** (finds bugs by running suites, not reading
  code). Added `review: machine` routing via `machine-review.js` so formatting and rename tasks
  stop queueing behind QA. Added enforced git guard rails in `.githooks/`, armed by `run-team`.
  Dashboard implementer columns are now config-driven (`"implementer": true`).

- 2026-07-20 — **Specs became the truth work flows from.** `spec/` is now human-owned with
  `status: draft|approved|superseded` frontmatter; only `approved` binds. Process docs moved to
  `spec/process/`. Eight overlapping proposal documents were merged into six living specs (the
  originals are in `archive/superseded-specs/`). Task frontmatter gained `spec:`, QA reviews
  against the cited spec, and `spec-discipline` is a shared partial. New `[REVIEW]` message type.
  `check-specs.js` + `check-workflow.js` (`npm run agents:check`) gate all of it.

- 2026-07-19 — **`inbox/` → `mail/in/`, `outbox/` → `mail/out/`** across all prompts, scripts, and this protocol. **`tasks/`** flat list replaced with kanban folders: `tasks/todo/` (backlog), `tasks/working-on/` (in-progress), `tasks/done/` (complete). `generate-dashboard.js` and `archive-task.js` updated to use the new paths. Team Lead prompt updated: pulls from `todo/`, moves to `working-on/` on assign, `archive-task.js` handles `working-on/` → `done/`; rejected tasks return to `todo/`.

- 2026-07-18 — Sleep Step recovery rule now explicitly covers harness **`aborted`** results (not only error/kill/timeout): Cursor can abort a correctly backgrounded sleep after a few seconds with no message; agents must re-invoke + end turn and must not abandon the await loop. Prompted by human report that agents "do not go to the sleep / await state."
- 2026-07-18 — Added **Agent restart hygiene (duplicate pollers)** under The Sleep Step: restarting a chat does not kill the old `await-messages*.js`; humans should clear orphaned pollers so each mailbox has exactly one watcher. Prompted by live duplicates on team-lead / akvj-developer / mainframe-developer the same day as the sleep-step fix.
- 2026-07-18 — Added **The Sleep Step** section: the sleep command must be run as a background task and the turn must end immediately after, never in the foreground and never followed by more work in the same turn. Prompted by the human flagging the Nitpicker staying "awake" instead of sleeping, and matches the likely root cause of the earlier ~11.5-hour QA Reviewer stall (a foreground-run, self-timeout-free `await-messages.js` silently killed by the harness's own tool-call timeout).
- 2026-07-18 — Documented the `drafts/` folder (human-only staging area for in-progress feature specs, not ready for Team Lead triage until promoted to `inbox/`) and clarified that the Overseer, not just the human, writes into `inbox/` (bug/architecture tickets from sweeps — already true in practice, just undocumented).
- 2026-07-18 — Added the **Git & Commits** section: the human owns commits. Agents leave edits in the working tree and do not `git add`/`commit`/`push` unless the human explicitly asks; binary assets and tracking-/history-altering operations always wait for the human; durable-only-if-committed changes are escalated via `outbox/`. Mirrors the updated `git-safety` skill.
- 2026-07-18 — Added two **optional** timer-driven specialists: the **Test Marshal** (Coverage Hawk; `[TEST]` tickets — systemic test coverage/flaky/stale, distinct from QA's per-task reviews) and the **Quartermaster** (`[DEPS]` tickets — deps/lockfile/version-skew/config, read-only diagnostics only, never installs/edits). Both report-only, both file into `inbox/`, neither on the dashboard; added to the shared-file notify list.
- 2026-07-18 — Added the **Nitpicker** role (naming/semantics/readability steward). Team is now six agents. Proactive/timer-driven like the Overseer but scoped to how code reads; files `[NIT]` tickets into `mail/in/` (was `inbox/` at the time), never edits product source/tasks/dashboard/specs. Added to the shared-file `[PROMPT-UPDATED]` notify list.
- 2026-07-17 — Added the Plan-Approval Gate (`[AWAITING-APPROVAL]`) after a task shipped without the human's requested approval — human confirmed the team must actually wait, not proceed after a timeout.
- 2026-07-17 — Added workflow retention / idle cleanup (Overseer promote-then-purge; see `routine-maintenance.md`).
- 2026-07-17 — Time Study Man role merged into Overseer; team is five agents; Overseer owns both process protocol and product specs.
- 2026-07-17 — Initial version, written alongside the introduction of the Time Study Man role.
