---
status: done
assignee: mainframe-developer
priority: low
---

# Task 127: Monorepo Scripts `lib/` + `sort-package-json` Decision

## Severity: Refactor

## Summary
Clean up `monorepo-scripts/` by extracting shared git-file discovery and deciding the fate of the custom `sort-package-json.js`.

## Acceptance Criteria
- Extract `getTrackedTextFiles()` from `check-line-endings.js` and `check-utf8.js` into `monorepo-scripts/lib/gitTrackedTextFiles.js` (mirror the `mainframe/scripts/clips/lib/` pattern).
- Optionally add `monorepo-scripts/lib/report.js` for the shared offender-list + `exit(1)` reporting.
- Wrap `sort-package-json.js` in a `main()` wrapper for consistency.
- Decide `sort-package-json`'s fate: either (a) adopt the npm `sort-package-json` package, delete the custom sorter, and wire it into CI/format; or (b) keep the custom sorter, wire it into CI/format, and document the reduced field order.
- Remove the unreachable final success `console.log` in `check-utf8.js`.
- Add a friendly error when checks are run outside a git repo.
- Verify `npm run lint` and `npm test` (if applicable) pass.

## Notes
- `monorepo-scripts/` is intentionally not an npm workspace; built-ins only.
- Epic reference: `.agents/workflows/developer-team/epics/refactor-for-greateness.md` §S1–S4.
