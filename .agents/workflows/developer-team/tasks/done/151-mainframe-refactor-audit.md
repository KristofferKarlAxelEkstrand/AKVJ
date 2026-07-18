---
status: done
assignee: mainframe-developer
priority: low
---

# Task 151: Refactor Audit Pass — Mainframe (Propose Only, Don't Implement)

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
current state of the code (post-epic, and post everything shipped since: edit-clip field
work, per-project clips, clip-ID generation rework, user-message system, sync timing/mapping
overrides, staging-preview fixes).

## This Is Ideas-Gathering — Do Not Refactor Yet
Write up proposals, don't implement. Send findings as a message into
`.agents/workflows/developer-team/inbox/` (use the `team-communication` skill / a
`team-update-*.md`-style file) — Team Lead will consolidate everyone's findings and slice
real tasks from there.

## What to Look For (per the request)
Focus on **structure and communication quality**, grounded in
`.agents/workflows/developer-team/spec/code-standards.md` and `spec/goal.md`:
- **Modularity**: god-modules doing too much, tangled responsibilities, duplication that
  should merge. `ClipEditorController.js` has grown substantially since its Task 125
  extraction — sync fields (137), FPS presets (144), global duration "Set all" (132), clip-ID
  generation wiring (131/135) all landed on it. Worth checking whether it needs a second
  split, or whether responsibilities are still coherent.
- **Naming**: vague/inconsistent names for files, classes, functions, events. Check
  consistency between newer modules (`syncTiming.js`, `mappingLeaf.js`, `generateClipId.js`,
  `ClipNameInput.js`, `UserMessage.js`/`UserMessages.js`) and established conventions.
- **Custom elements**: is `<clip-name-input>` (Task 135), `<user-messages>`/`<user-message>`
  (Task 133) following the same light-DOM conventions as `StagingPreview`/`ClipFrames`? Tag
  naming consistency (the epic already flagged mixed prefixing — check if newer elements made
  it better or worse).
- **Event-driven communication**: `mainframeState`/`EventTarget` usage — any imperative wiring
  that should be a subscription instead (`setStatus` vs `messages.*` coexistence from Task
  133 — is the split still well-reasoned, or has it blurred)? Any new dead/unused events?

## Output Format
Concrete and specific — file/area, the problem, the suggested change. Not vague ("clean up
X"). One message covering your whole pass is fine.

## Constraints
- **Propose only** — do not edit source files for this task.
- Prefer delete/merge over new abstraction in your proposals.
- Don't touch the on-disk clip JSON shape in proposals (human-first per `clip-schema.md`).
