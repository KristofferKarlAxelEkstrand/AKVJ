---
type: test
from: test-marshal
created: 2026-07-20T09:24:29Z
---

# [TEST] Workflow scripts coverage gaps

Swept `.agents/workflows/scripts/`: 8 test files cover 69 cases, but several new CLI/util modules have zero direct tests and are not exercised by `test:workflow-team` (which only self-tests `run-team`).

## Checklist

- `.agents/workflows/scripts/check-references.js` (149 lines) — **unit (node)**
  - What is untested: the entire reference checker (`collectDocs`, `resolves`, exit-code path).
  - Cases to add:
    - Valid relative references resolve from the doc's own directory.
    - Repo-root-relative references (`akvj/src/js/core/AppState.js`) resolve.
    - Workflow-root references (`co-workers/test-marshal.prompt.md`) resolve.
    - Template placeholders (`<task-id>`, `[TASK]-...`, `...`) are skipped.
    - Dangling references are reported with `file:line → path` and exit code 1.
    - `REPO_DOCS` (`AGENTS.md`, `CLAUDE.md`) are scanned when present.
    - Excluded directories (`archive`, `node_modules`, `tasks`, `mail`, `slack`, `memory`, etc.) are not recursed.
    - Custom workflow argument (`node check-references.js other-workflow`) switches root.

- `.agents/workflows/scripts/post-awaiting.js` (54 lines) — **unit (node)**
  - What is untested: argument parsing, JSON write, `--clear`, and error exits.
  - Cases to add:
    - Writes `{agent, waitingOn, reason, since}` to `health/awaiting/<agent>.json`.
    - Multiple comma-separated values in `waitingOn` become an array.
    - `--clear` removes the awaiting file and exits 0.
    - Missing arguments exit 1 with usage.
    - Empty `waitingOn` list exits 1 with an error.

- `.agents/workflows/scripts/root.js` (6 lines) — **unit (node)**
  - What is untested: `REPO_ROOT` and `DEFAULT_WORKFLOW` are only imported, never asserted.
  - Cases to add:
    - `REPO_ROOT` resolves to the repository root (three levels above `scripts/`).
    - `DEFAULT_WORKFLOW` equals `developer-team`.

- `.agents/workflows/scripts/lib/frontmatter.js` (117 lines) — **unit (node)**
  - What is only partially tested: covered indirectly through `message.test.js` but several branches are not hit.
  - Cases to add:
    - `splitFrontmatter` handles CRLF line endings and trailing `---` with no newline.
    - A block list key that receives no items becomes `''`, not `[]`.
    - `renderFrontmatter` skips `undefined`, `null`, and empty-string values.
    - Inline list items keep quoted strings intact.

## Notes

- `test:workflow-scripts` currently passes (69 tests, 8 files).
- `test:workflow-team` is a bash self-test for `run-team` and does not cover these modules.
- These scripts are infrastructure, but `check-references.js` is intended to gate docs hygiene and `post-awaiting.js` is on the idle/sleep path, so regressions would be silent.
