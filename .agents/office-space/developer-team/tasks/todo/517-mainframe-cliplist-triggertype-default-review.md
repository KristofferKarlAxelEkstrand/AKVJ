---
status: todo
stage: queued
priority: low
assignee: none
work_class: general
risk: medium
created: 2026-07-30
owned_paths:
  - mainframe/src/js/ClipList.js
  - mainframe/test/ClipList.test.js
verification_tier: integration
migration_source: legacy-workflow
migration_previous_state: backlog
---
# 517 — ClipList triggerType filter default: track/review undisclosed change

Reported by QA (`[BUG]-cliplist-triggertype-default-undisclosed.md`), found while reviewing task
504 (now archived, approved on its own claimed scope).

`mainframe/src/js/ClipList.js:4,169` — the 504 diff also changed `#filterAndSortClips`'s
`triggerTypeFilter` comparison from raw `clip.meta.triggerType !== filter` to
`resolveTriggerType(clip.meta.triggerType) !== filter` (new `resolveTriggerType` import from
`clipSchema.js`).

Effect: a clip with omitted/empty `meta.triggerType` now matches a piano-roll
`triggerType: 'momentary'` filter (previously excluded). This matches the documented default
(`triggerType` defaults to `"momentary"` per `AGENTS.md`) — looks correct, same shape as the bug
504 fixed, just for `triggerType` instead of `role`. Already covered by one test
(`ClipList.test.js` — "pianorollFilters momentary includes clips with omitted triggerType").

Nothing to fix — this is a paper trail task. Confirm the change is intentional/correct and
record it on its own, since it landed without its own task or report.

## Verify

`npm run lint -w mainframe && npm run test -w mainframe`.

Scope: **mainframe-developer**.
