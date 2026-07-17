# Task 22: Continue Custom Element Migration

## Objective
Continue migrating mainframe UI to native Web Components, extracting from `main.js`.

## Sub-tasks
1. Extract clip list into `<akvj-clip-list>` component
2. Extract clip editor form into `<akvj-clip-editor>` component
3. Extract mapping table into `<akvj-mapping-table>` component

## Pattern (established by `<akvj-piano-keyboard>`)
- Custom element class in `mainframe/src/js/{ComponentName}.js` (PascalCase)
- `customElements.define('akvj-{kebab-name}', ClassName)`
- Light DOM, no Shadow DOM
- Reactive state via `observedAttributes` + setters
- Events dispatched with `bubbles: true` for parent delegation
- Import via side-effect: `import './js/ComponentName.js'`

## Dependencies
None
