---
status: in-progress
assignee: mainframe-developer
priority: medium
---

# Task 154: Unify Mainframe User Feedback Onto `messages.*` (Fix Stray `alert()`) + Document Tag-Prefix Rule

## Source
Consolidated from mainframe refactor audit (Task 151):
`.agents/workflows/developer-team/inbox/read/team-update-mainframe-refactor-audit.md`
(priorities #3 and #4 — bundled since both are "consistency of user-facing surfaces").

## Bumped Above the Audit's Own Priority — Real Regression, Not Just Polish
The audit flags `main.js`'s `deleteClip` still uses `alert()`. This isn't just inconsistent
styling — it's a **direct regression against the point of Task 133** (building
`<user-messages>`/`messages.*` specifically to replace ad-hoc `alert()`-style interruptions
with a proper, accessible, consistent modal system). A stray `alert()` surviving post-133
undermines that investment. Treat this as the priority item in this task, not optional polish.

## Findings Being Actioned
1. **`main.js` `deleteClip`**: replace `alert()` with `messages.error(...)`. Keep `confirm()`
   for the destructive **confirmation** step (that's a different, legitimate use — blocking
   user consent before an irreversible action — not an outcome notification).
2. **`main.js` `/clip/edit/:clipId` catch**: hydrate failure currently uses
   `setStatus(upload-status, ...)` while `ClipEditorController` elsewhere uses
   `messages.error`. Route hydrate failures through `messages.error` only, for consistency.
3. **Boot `Promise.all` catch**: API error currently written to `upload-status`. Route through
   `messages.error`.
4. **`ClipEditorController`**: currently clears `#upload-status` then also calls `messages.*`
   for every outcome — the progressive status text becomes stale/redundant. Either stop
   injecting `setStatus` when it's only being cleared, or reserve `setStatus` strictly for
   in-progress states ("Loading…", "Saving…") and never leave stale text once `messages.*`
   has taken over the outcome.
5. **Document the tag-prefix rule** (no mass rename — per the audit's own conclusion):
   recommend `akvj-*` for top-level app shells appearing once in the shell, unprefixed for
   reusable leaf widgets. Write this down (a short note in `clip-schema.md` or a new
   `code-standards.md` section) so future elements follow one rule consistently, without
   renaming anything that already exists.

## What NOT to Do
- Don't turn panel `setStatus` into an `EventTarget`-based system — the audit explicitly says
  current imperative panel status is fine unless multiple subscribers appear.
- Don't merge the `messages` facade into `mainframeState.*` directly — audit calls this
  "thin sugar, fine as-is," optional future cleanup only.
- Don't mass-rename any existing custom element tags for prefix consistency.

## Suggested Tests
- `main.js`/`ClipEditorController` tests: hydrate failure, boot failure, and delete failure
  all route through `messages.error` (mock/spy assertions), not `alert`/stale `setStatus`.

## Files
- `mainframe/src/main.js`
- `mainframe/src/js/ClipEditorController.js`
- `.agents/workflows/developer-team/spec/clip-schema.md` or
  `.agents/workflows/developer-team/spec/code-standards.md` (tag-prefix rule documentation)
