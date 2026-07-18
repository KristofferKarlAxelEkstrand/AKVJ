---
status: done
assignee: mainframe-developer
priority: low
---

# Task 101: Extract Shared ChoiceItem/ChoiceList Base from RoleChoice/SortChoice

## Severity: Low (Tech Debt — architectural cleanup)

## Location
- `mainframe/src/js/RoleChoice.js` / `mainframe/src/js/SortChoice.js`
- `mainframe/src/js/RoleChoices.js` / `mainframe/src/js/SortChoices.js`

## Problem
Tasks 90 and 91 produced two component pairs that are structurally identical (~130 near-identical lines across 4 files). They differ only in property/event names and aria-label. Both also share the same accessibility gap: individual items get `tabIndex = 0` (independently tab-stoppable) rather than the standard ARIA listbox pattern of one roving tabindex + arrow-key navigation.

## Requirements
1. **Extract a shared generic pair** — e.g. `ChoiceItem`/`ChoiceList` (or a small mixin/base class) parameterized by `valueProp`, `changeRequestEvent`, `changeEvent`, and `ariaLabel`
2. **Have `RoleChoice`/`SortChoice` become thin subclasses or config instances** of the shared base
3. **Fix roving-tabindex ARIA gap** — one roving tabindex + arrow-key navigation between options (standard ARIA listbox pattern)
4. **Verify all existing tests still pass** after refactoring

## When to Implement
Only when a 3rd similar "choice list" consumer shows up (e.g. Projects UI or category filters), or when the accessibility gap becomes a priority. With only 2 consumers and KISS constraint, extraction now could be premature abstraction.

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors
- Run `npm run build -w mainframe` to ensure build succeeds

## Constraints
- **Vanilla JS only** — no frameworks
- **KISS** — don't over-abstract
- **CSS per element** — use SCSS scoped under custom element
- **NPM Protocol**: NEVER run `npm install` yourself.

## Notes
- Flagged by Overseer as tech debt, not a functional bug
- Both pairs modeled on same pattern intentionally (Task 91 explicitly copied Task 90 style)
- Accessibility gap (roving tabindex) should be fixed in the same pass
