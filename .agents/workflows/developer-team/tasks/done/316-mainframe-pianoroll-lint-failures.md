---
status: done
assignee: mainframe-developer
priority: high
---

# Task 316: Mainframe `PianoRoll.js` lint failures

## Source

Bug report: `.agents/workflows/developer-team/mail/in/read/[BUG]-mainframe-pianoroll-lint-failures-2026-07-19.md`

## Description

`npm run lint` was failing on `mainframe/src/js/PianoRoll.js` due to missing braces after `if` conditions (`curly` rule).

## Findings and actions

- Inspected `mainframe/src/js/PianoRoll.js` for unbraced `if` statements around the reported line numbers (27–32 and 540–544).
- Ran `npx eslint --config eslint.config.js mainframe/src/js/PianoRoll.js --fix` as a safety pass; no changes were required because braces were already present.
- Verified there are no remaining `if` statements without braces in `PianoRoll.js`.
- Reviewed the rest of the file and found no other obvious lint issues introduced by the filter-mode refactor.

## Affected files

- `mainframe/src/js/PianoRoll.js`

## Verification

- `npm run lint -w mainframe` — passed
- `npm run lint` (root) — passed
- `npm run test -w mainframe` — passed
  - Node suite: 519 tests passed
  - UI light suite: 81 tests passed
  - UI heavy suite: 137 tests passed
- `npm run build -w mainframe` — passed

## Notes

- The reported `curly` errors were already resolved in the current file state; verification confirms the lint suite is clean.
