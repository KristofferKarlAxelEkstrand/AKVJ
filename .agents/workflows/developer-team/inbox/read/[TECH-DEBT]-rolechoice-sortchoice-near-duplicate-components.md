# [TECH-DEBT] RoleChoice/RoleChoices and SortChoice/SortChoices are near-duplicate components

## Where
- `mainframe/src/js/RoleChoice.js` / `mainframe/src/js/SortChoice.js`
- `mainframe/src/js/RoleChoices.js` / `mainframe/src/js/SortChoices.js`

## Problem
Tasks 90 and 91 (Sort Component, Role Component) produced two component pairs that are structurally identical — same private fields, same `connectedCallback`/`disconnectedCallback` shape, same click+keydown wiring, same `role="option"`/`role="listbox"` ARIA setup, same `#updateSelection()` loop — differing only in property/event names (`sortValue`/`sortMode`/`sortchange*` vs `roleValue`/`roleFilter`/`rolechange*`) and the aria-label string. That's ~130 near-identical lines across 4 files. Task 91 explicitly modeled itself on Task 90 ("identical in style to the sort choices component"), so the duplication is a natural result of how the tasks were scoped, not a developer mistake.

Both pairs also share the same accessibility gap: individual choice items each get `tabIndex = 0` (independently tab-stoppable), rather than the standard ARIA listbox pattern of one roving tabindex + arrow-key navigation between options. Since it's duplicated, fixing it later means fixing it twice.

## Why flagging, not fixing now
This is a judgment call, not a clear bug — with only 2 consumers and an explicit KISS constraint on both source tasks, an extraction now could be premature abstraction. Flagging for visibility so it's a known quantity.

## Suggested Fix (only if/when a 3rd similar "choice list" consumer shows up, e.g. for Projects UI or category filters)
Extract a shared generic pair — e.g. `ChoiceItem`/`ChoiceList` (or a small mixin/base class) parameterized by `valueProp`, `changeRequestEvent`, `changeEvent`, and `ariaLabel` — and have `RoleChoice`/`SortChoice` become thin subclasses or config instances. Worth fixing the roving-tabindex ARIA gap in the same pass since it's shared logic.

## Priority
Low — cosmetic/architectural, not a functional bug. Good opportunistic pickup, not urgent.
