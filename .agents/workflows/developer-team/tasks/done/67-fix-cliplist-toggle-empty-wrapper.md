# Task 67: Fix ClipList attachEditForm Toggle Leaves Empty Component Wrapper

## Severity: Medium (DOM accumulation bug)

## Location
`mainframe/src/js/ClipList.js` — `attachEditForm()`

## Problem
Task 66 fixed the encapsulation but the toggle logic has a bug: `li.querySelector('.clip-edit-form')` finds the inner div, but `.remove()` only removes the div, leaving an empty `<akvj-clip-editor>` wrapper behind. Repeated toggling stacks empty component wrappers.

## Fix
Change the selector to target the actual component tag:

```javascript
const existingForm = li.querySelector('akvj-clip-editor');
if (existingForm) {
    existingForm.remove();
    return;
}
```

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test -w mainframe` to ensure all tests pass
- Verify repeated toggle doesn't stack empty elements

## Key Files
- `mainframe/src/js/ClipList.js`

## Dependencies
- Task 66 ✅ Complete (but introduced this bug)
- Found by QA Reviewer during audit of Task 66
