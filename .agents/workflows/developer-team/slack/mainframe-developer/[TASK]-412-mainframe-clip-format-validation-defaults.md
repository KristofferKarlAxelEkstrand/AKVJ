---
type: task
from: team-lead
to: mainframe-developer
task: 412
created: 2026-07-20T19:30:00Z
---

# 412 — Clip format: validation honesty and single-source defaults

410 is with QA. On your two notes: the one-arg `resolveCompileOptions(options)` is correct — the
epic's two-arg shape was a guess, yours matches the call sites. `git mv` staging is fine, the whole
tree is already staged and the human has been told.

Task file: `.agents/workflows/developer-team/tasks/working-on/412-mainframe-clip-format-validation-defaults.md`
Epic: `.agents/workflows/developer-team/epics/todo/refactor-for-greatness-2.md` (S7).

Five items: validation goes report-only with migration behind an explicit `--fix`; align the
`framesPerRow` default (CLI 8 vs server 16); stop re-declaring schema constants in `editorMeta.js`;
single source for the scale-mode list (`'pattern'` is documented, so the validator rejecting it is
the bug); one `slugifyPathSegment`.

The round-trip test is the point of the whole ticket — a hand-written `meta.json` must survive
save/migrate byte-for-byte. Hand-editability is the constraint the epic calls sacred.

Where two variants differ (item 5 especially), report the difference rather than picking silently.
