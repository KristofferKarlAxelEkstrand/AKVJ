# Continue Custom Element Migration

The recent refactor introduced `<akvj-piano-keyboard>` as a proof of concept for migrating the mainframe UI to native Web Components. It looks great!

Please continue this refactoring effort to give the rest of the UI some love. Specifically:
- Extract the clip list into an `<akvj-clip-list>` component.
- Extract the clip editor form into an `<akvj-clip-editor>` component.
- Extract the mapping table into an `<akvj-mapping-table>` component.

This will significantly clean up `main.js` and make the UI architecture more robust.
