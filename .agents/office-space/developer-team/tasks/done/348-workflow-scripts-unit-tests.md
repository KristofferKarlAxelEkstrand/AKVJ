---
status: done
assignee: utility-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 348: Add workflow scripts unit tests

## Source

Test Marshal `[TEST]-workflow-scripts-coverage.md`

## Description

`.agents/workflows/scripts/` has 8 test files covering 69 cases, but several new CLI/util modules have zero direct tests and are not exercised by `test:workflow-team` (which only self-tests `run-team`). Add unit tests for the following modules:

### `check-references.js`

- Valid relative references resolve from the doc's own directory.
- Repo-root-relative references (e.g. `akvj/src/js/core/AppState.js`) resolve.
- Workflow-root references (e.g. `co-workers/test-marshal.prompt.md`) resolve.
- Template placeholders (`<task-id>`, `[TASK]-...`, `...`) are skipped.
- Dangling references are reported with `file:line → path` and exit code 1.
- `REPO_DOCS` (`AGENTS.md`, `CLAUDE.md`) are scanned when present.
- Excluded directories (`archive`, `node_modules`, `tasks`, `mail`, `slack`, `memory`, etc.) are not recursed.
- Custom workflow argument (`node check-references.js other-workflow`) switches root.

### `post-awaiting.js`

- Writes `{agent, waitingOn, reason, since}` to `health/awaiting/<agent>.json`.
- Multiple comma-separated values in `waitingOn` become an array.
- `--clear` removes the awaiting file and exits 0.
- Missing arguments exit 1 with usage.
- Empty `waitingOn` list exits 1 with an error.

### `root.js`

- `REPO_ROOT` resolves to the repository root (three levels above `scripts/`).
- `DEFAULT_WORKFLOW` equals `developer-team`.

### `lib/frontmatter.js`

- `splitFrontmatter` handles CRLF line endings and trailing `---` with no newline.
- A block list key that receives no items becomes `''`, not `[]`.
- `renderFrontmatter` skips `undefined`, `null`, and empty-string values.
- Inline list items keep quoted strings intact.

## Verification

- `npm run test:workflow-scripts` passes with the new cases included.
- `npm run test:workflow-team` still passes.
