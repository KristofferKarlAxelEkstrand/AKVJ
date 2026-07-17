# Task 22c: Extract `<akvj-mapping-table>` Component

## Objective
Extract the mapping table from `main.js` into a reusable `<akvj-mapping-table>` custom element.

## Requirements
- Move `renderMapping()`, `updateMappingSummary()`, mapping row creation into the component
- Component accepts `mappings` (array) via setter
- Dispatches `mappingremove` event (bubbles: true) with entry detail
- Import via side-effect in `main.js`
