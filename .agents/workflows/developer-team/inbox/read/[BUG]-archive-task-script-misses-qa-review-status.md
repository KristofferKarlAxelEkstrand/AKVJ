# [BUG] archive-task.js doesn't convert status: qa-review to done

## Where
`.agents/workflows/developer-team/scripts/archive-task.js`, lines 52-56.

## Problem
When a task is archived to `tasks/done/`, the script only rewrites the frontmatter status for two prior values:
```js
content = content.replace(/status:\s*in-progress/, 'status: done');
content = content.replace(/status:\s*backlog/, 'status: done');
```
It has no case for `status: qa-review` — which, by count, is the **most common** pre-archive status in this repo (10 occurrences across `tasks/` at time of writing, vs. 1 `in-progress` and 3 `backlog`). As a result, the majority of archived tasks in `tasks/done/` retain stale `status: qa-review` frontmatter despite being physically done. Confirmed currently affected files:

```
tasks/done/102-unique-id-generation.md
tasks/done/103-accept-png-jpg-gif.md
tasks/done/104-alpha-preserve-scale-modes.md
tasks/done/39b-mainframe-dependency-upgrades.md
tasks/done/62-add-tests-ui-components.md
tasks/done/94-piano-roll-edit-mode.md
tasks/done/95-piano-roll-category-mode.md
tasks/done/96-piano-roll-play-mode.md
tasks/done/97-piano-roll-multi-instance.md
```

## Suggested Fix
Add the missing case: `content = content.replace(/status:\s*qa-review/, 'status: done');`. Also consider making this more robust to any status value, e.g. a single regex `content = content.replace(/status:\s*\S+/, 'status: done')` on the first frontmatter line, so future status vocabulary additions don't silently reintroduce this same gap.

## Optional cleanup
While in this area: the already-archived files listed above could have their stale `status: qa-review` corrected to `status: done` in the same pass, for consistency (low priority — not blocking).

## Priority
Low — cosmetic/metadata only, doesn't affect current dashboard rendering (which only branches on `backlog`/`in-progress`/no-status). Worth fixing since it's a one-line change with a >50% hit rate.
