# Task 66: Fix ClipList attachEditForm Dead Code and Encapsulation

## Severity: Medium (Architecture/Dead code)

## Location
- `mainframe/src/js/ClipList.js` — `clipedit` event payload and `attachEditForm()`
- `mainframe/src/main.js` — `clipedit` event listener

## Problem
Task 53 fixed `attachEditForm` to properly use `clipId`, but this method is entirely dead code — it's never called anywhere. `main.js` bypasses it by reaching directly into the `<akvj-clip-list>` component's internal DOM.

The `clipedit` event in `ClipList.js` leaks its internal `<li>` DOM node (`listItem: li`) in the event payload. `main.js` uses this leaked reference to manually query and append the form, breaking Web Component encapsulation.

## Fix
1. In `ClipList.js`, remove `listItem: li` from the `clipedit` event detail payload. Only emit `clipId` and `clip` data.
2. In `main.js`, refactor the `clipedit` event listener to use the `attachEditForm` method:

```javascript
clipListElement.addEventListener('clipedit', event => {
    const { clip, clipId } = event.detail;
    const editor = document.createElement('akvj-clip-editor');
    editor.clip = clip;
    clipListElement.attachEditForm(clipId, editor);
});
```

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test -w mainframe` to ensure all tests pass
- Verify editing clips still works correctly in the UI

## Key Files
- `mainframe/src/js/ClipList.js`
- `mainframe/src/main.js`

## Dependencies
- Task 53 ✅ Complete (but the fix was on dead code)
- Found by QA Reviewer during audit of Task 53
