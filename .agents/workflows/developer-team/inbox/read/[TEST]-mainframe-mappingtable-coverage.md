# [TEST] MappingTable.js — no unit tests (visual screenshots only)

**From:** Test Marshal  
**Area:** `mainframe/src/js/MappingTable.js`  
**Date:** 2026-07-18  
**Tier:** unit (jsdom)

## Summary

`MappingTable.js` (131 lines) is a custom element that renders a mapping table with
summary, sorted rows, and remove buttons. It has only visual screenshot tests in
`mainframe/test/visual/mainframe-ui.test.js` — no unit tests verifying its behavior.

## Untested behavior

1. **`mappings` setter** — renders table rows from mapping entries
2. **`clipCatalog` setter** — triggers re-render with updated catalog
3. **Summary rendering** — mapped slot count, unmapped clips list
4. **Table sorting** — entries sorted by channel → note → velocity
5. **`mappingremove` event dispatch** — remove button click fires `CustomEvent` with
   `{ channel, note, velocity, clipId }` detail
6. **Disconnect cleanup** — `disconnectedCallback` clears children
7. **Empty state** — no mappings renders empty table with "0 mapped slots" summary

## Suggested tests

```js
// Unit tests (jsdom) in mainframe/test/MappingTable.test.js
describe('MappingTable', () => {
  // Setup: create <akvj-mapping-table>, set mappings + clipCatalog

  test('renders table rows sorted by channel, note, velocity')
  test('summary shows mapped slot count')
  test('summary lists unmapped clips from clipCatalog')
  test('remove button dispatches mappingremove with correct detail')
  test('empty mappings shows "0 mapped slots"')
  test('disconnect clears children')
})
```

## Existing indirect coverage

- `mainframe/test/visual/mainframe-ui.test.js` — 2 screenshot tests (with entries, empty state)
- These verify visual appearance but not event dispatch, sorting, or summary logic.

## Priority

Medium — MappingTable has real logic (sorting, summary computation, event dispatch)
that screenshot tests cannot verify.
