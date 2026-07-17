# [BUG] ClipList attachEditForm is dead code (Encapsulation broken)

## Issue Description
Task 53 updated the `attachEditForm` method in `ClipList.js`, but this method is entirely dead code because it is never called anywhere in the codebase. 

Instead, `main.js` bypasses the method entirely by reaching directly into the `<akvj-clip-list>` component's internal DOM. This happens because the `clipedit` event in `ClipList.js` incorrectly leaks its internal `<li>` DOM node (`listItem: li`) in the event payload. 

`main.js` uses this leaked reference to manually query and append the form:
```javascript
clipListElement.addEventListener('clipedit', event => {
	const { clip, listItem } = event.detail;
	const existingForm = listItem.querySelector('.clip-edit-form');
	// ... directly manipulates listItem
});
```
This breaks Web Component encapsulation and renders the logic written in Task 53 unused.

## How to Fix
1. In `ClipList.js`, remove `listItem: li` from the `clipedit` event detail payload. The component should only emit the `clipId` and `clip` data.
2. In `main.js`, refactor the `clipedit` event listener to actually use the `attachEditForm` method:
```javascript
clipListElement.addEventListener('clipedit', event => {
	const { clip, clipId } = event.detail;
	const editor = document.createElement('akvj-clip-editor');
	editor.clip = clip;
	clipListElement.attachEditForm(clipId, editor);
});
```
This will properly restore encapsulation and utilize the fixed method from Task 53.
