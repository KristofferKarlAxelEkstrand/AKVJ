---
status: done
assignee: akvj-developer
priority: medium
---

# Task 177: Add Unit Tests for MappingTable.js

## Source
`.agents/workflows/developer-team/inbox/[TEST]-mainframe-mappingtable-coverage.md`
(Test Marshal — MappingTable has only visual screenshot tests, no unit tests).

## Scope

`mainframe/src/js/MappingTable.js` (131 lines) — custom element with sorting, summary, and event dispatch logic. Create `mainframe/test/MappingTable.test.js` with:

- `mappings` setter renders table rows from mapping entries
- `clipCatalog` setter triggers re-render with updated catalog
- Summary rendering: mapped slot count, unmapped clips list
- Table sorting: entries sorted by channel → note → velocity
- `mappingremove` event dispatch: remove button click fires `CustomEvent` with `{ channel, note, velocity, clipId }` detail
- Disconnect cleanup: `disconnectedCallback` clears children
- Empty state: no mappings renders empty table with "0 mapped slots" summary

## Verification
- `npm run test -w mainframe`
- `npm run lint`

## Files
- `mainframe/test/MappingTable.test.js` (new)
- `mainframe/src/js/MappingTable.js` (reference)
