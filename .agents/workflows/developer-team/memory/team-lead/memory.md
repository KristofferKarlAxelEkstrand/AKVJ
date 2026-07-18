# Team Lead Memory

This file serves as your persistent memory. Update it as you delegate tasks, track overall project progress, or learn new things about the developer team workflow.

## Current Project State
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. This should be an ongoing refactor in tiny, safe steps.
- The `akvj-developer` handles pure visualizer work (vanilla JS, rendering, Web MIDI) and its specific test suite.
- The `mainframe-developer` handles tooling, clip processing, UI, configuration, and its specific test suite.
- Shared logic exists in `clips/`.

## Ongoing Tasks
- Keybed-for-mapping epic (`epics/keybed-for-mapping.md`): **complete** — all 4 phases (184-187)
  QA-approved and archived to `tasks/done/` 2026-07-18. Epic status set to "Done". A post-archival
  follow-up fix (two `<piano-roll>` instances on the Mapping tab both independently sticky, causing
  overlap; fixed with a `.piano-roll-dock` wrapper) was caught by the developer's own verification
  pass and routed to QA as `[TASK]-review-187-piano-roll-dock-overlap-followup.md` — noted in the
  epic file rather than reopening task 187. Still outstanding: Phase 4 sticky-bottom behavior needs a
  human/CI visual pass (no Chromium in-container).
- Task 189 (velocity-breakpoint drag inversion): done + reported + routed to QA 2026-07-18. Report
  confirmed the developer deliberately implemented only one of the two suggested fixes (guard in
  `#startHandleDrag`) because the other (reject-drop-when-too-many-clips) contradicts an explicit
  "no artificial cap" decision in `spec/feature-keybed-for-mapping.md` — good judgment call, matches
  precedent of checking specs before actioning suggested fixes. Also rewrote the vacuous test I'd
  flagged in the task text (verified independently by reading the actual test file before trusting
  the report).
- Task 191 (PianoKey.js untested drag/cleanup paths, low priority) — dispatched to mainframe-developer
  2026-07-18, unclaimed as of last check.
- Backlog (mainframe domain, not yet dispatched — mainframe-developer had unclaimed work each time):
  Task 190 (clip-editor naming sweep — dropped the ticket's tag-prefix item, already covered by
  `spec/code-standards.md:13` which forbids mass-renaming), Task 192 (test coverage for per-image
  scale/placement compositing in `ClipFrame.js`/`StagingPreview.js`, medium priority).
- Task 82 (grayscale/demo-scene effects, akvj domain) intentionally NOT dispatched even when
  akvj-developer is idle — its own text says "needs proper design discussion before implementation."
  Don't force-assign it just to fill an empty mailbox; wait for a real design-ready follow-up task.

## Judgment calls worth remembering
- When a `[NIT]`/ticket's suggested fix conflicts with an already-documented spec rule, check
  `spec/code-standards.md` (and siblings) before batching it into a task — don't blindly action every
  finding. Cite the rule and exclude the conflicting item rather than silently dropping it.
- Dispatch the next epic phase as soon as the prior phase's `[REPORT]` confirms tests pass + matches
  spec, without waiting for formal QA sign-off — phase dependency is about the implementation existing
  in the tree, not the QA gate; waiting on a possibly-stalled QA queue would stall the whole epic.
- Before trusting a developer's report at face value, spot-check the specific claim when it matters
  (e.g. grepped the actual test file to confirm a flagged vacuous test was really rewritten, not just
  supplemented) — cheap, and catches the gap between "self-reported done" and actually done.
- Only dispatch one task at a time per developer mailbox — if their slack folder already has an
  unclaimed `[TASK]`, leave new backlog items in the backlog rather than stacking a second one on top,
  even when the "assign a new task on `[REPORT]`" instruction would otherwise apply.

## Process Watch
- 2026-07-18 (RESOLVED): QA Reviewer had a severe backlog (35 `[TASK]-review-*` files sitting
  unprocessed, tasks 152-188) and, once it came back online, sent a burst of ~28 redundant
  `[APPROVED]` verdicts for tasks that were already archived — root cause was QA not deleting its own
  review-request files from `slack/qa-reviewer/` after acting on them. Flagged to the Overseer via
  `slack/overseer/team-update-qa-reviewer-not-clearing-own-mailbox.md`; Overseer added a stale-leftover
  guard + per-task delete atomicity to `qa-reviewer.prompt.md` and restarted QA on the fresh prompt.
  QA is now healthy (mailbox down to ~2 files, sending fresh non-redundant verdicts). No further action
  needed — just a precedent: when I see redundant/duplicate verdicts for already-archived tasks, that's
  a QA-mailbox-hygiene symptom, not a sign I mismanaged archiving — verify against `tasks/done/` before
  assuming an anomaly is mine to fix, and flag process/hygiene issues to `slack/overseer/` rather than
  touching another agent's mailbox myself.
