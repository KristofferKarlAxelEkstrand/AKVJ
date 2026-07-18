---
status: in-progress
assignee: akvj-developer
priority: low
---

# Task 150: Refactor Audit Pass — akvj (Propose Only, Don't Implement)

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-developer-refactor-audit.md`

## Important — Check First
`.agents/workflows/developer-team/epics/refactor-for-greateness.md` already exists and its
entire "Suggested slicing" (9 items) has been **fully implemented and QA-approved** via Tasks
119–127 this session (clip-format core, constants/dead-code sweep, `Clip.js` split,
`ClipLoader` merge, mainframe shared module, `server/index.js` split, `ClipEditorController`
extraction, effects DRY/MIDI routing/loading overlay, monorepo-scripts `lib/`). **Read it
first** so you don't re-propose anything already done — check `tasks/done/` (119-127) if
unsure whether something's already landed. This audit is for **new** findings, from the
current state of the code (post-epic, post the sync-timing feature, pattern/placement
rendering, user-message system, and everything else shipped since).

## This Is Ideas-Gathering — Do Not Refactor Yet
Write up proposals, don't implement. Send findings as a message into
`.agents/workflows/developer-team/inbox/` (use the `team-communication` skill / a
`team-update-*.md`-style file) — Team Lead will consolidate everyone's findings and slice
real tasks from there.

## What to Look For (per the request)
Focus on **structure and communication quality**, grounded in
`.agents/workflows/developer-team/spec/code-standards.md` and `spec/goal.md`:
- **Modularity**: god-modules doing too much, tangled responsibilities, duplication that
  should merge. Look especially at anything that's grown since the epic — `Clip.js` picked up
  `scaleMode`/`placement`/pattern-tiling logic (Task 142), `clipMetadata.js` picked up sync
  expansion (Task 136) and placement resolution (Task 142) — worth checking whether either has
  drifted back toward god-module territory after these additions.
- **Naming**: vague/inconsistent names for files, classes, functions, events. Check
  consistency between the newer additions (`UserMessage.js`/`UserMessages.js`, `snapToPixel`,
  `resolveFrameDurationBeats`) and established conventions.
- **Custom elements**: is `<user-messages>`/`<user-message>` (Task 134) following the same
  light-DOM conventions as `LoadingOverlay`/`DebugOverlay`? Tag naming consistency.
- **Event-driven communication**: `AppState`/`EventTarget` usage — any imperative wiring that
  should be a subscription instead? Any new dead/unused events from recent work?

## Output Format
Concrete and specific — file/area, the problem, the suggested change. Not vague ("clean up
X"). One message covering your whole pass is fine.

## Constraints
- **Propose only** — do not edit source files for this task.
- Prefer delete/merge over new abstraction in your proposals.
- Don't touch the on-disk clip JSON shape in proposals (human-first per `clip-schema.md`).
