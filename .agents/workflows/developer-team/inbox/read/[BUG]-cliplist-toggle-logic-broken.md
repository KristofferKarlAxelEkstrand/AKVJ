# [BUG] ClipList attachEditForm Toggle Logic Leaves Empty Component Wrapper

## Issue Description
Task 66 successfully fixed the encapsulation leak and correctly utilized the `attachEditForm` method. However, testing the form toggle behavior revealed a DOM accumulation bug in how the form is removed.

Inside `attachEditForm`:
```javascript
const existingForm = li.querySelector('.clip-edit-form');
if (existingForm) {
	existingForm.remove();
	return;
}
```
Because the appended `formElement` is an `<akvj-clip-editor>` component (which *contains* a `<div class="clip-edit-form">`), querying and calling `.remove()` on `.clip-edit-form` only guts the inside of the component. It leaves an empty `<akvj-clip-editor>` wrapper element behind in the `<li>` tag. 

If a user repeatedly clicks the Edit button to toggle the form, empty `<akvj-clip-editor>` tags will stack up indefinitely inside the list item.

## How to Fix
In `mainframe/src/js/ClipList.js`, update the selector in `attachEditForm` to target the actual component tag rather than its internal class:

```javascript
	attachEditForm(clipId, formElement) {
		for (const li of this.children) {
			const img = li.querySelector('img');
			if (img && img.alt === clipId) {
				const existingForm = li.querySelector('akvj-clip-editor'); // <--- Fix is here
				if (existingForm) {
					existingForm.remove();
					return;
				}
				li.append(formElement);
				return;
			}
		}
	}
```
