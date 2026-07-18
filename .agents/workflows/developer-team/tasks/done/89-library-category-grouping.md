# Task 89: Library Page — Group Clips by Category with Custom Elements

## Severity: Medium (Feature — user requested, evolves Task 85)

## Location
- `mainframe/src/js/ClipCategory.js` (new — custom element container)
- `mainframe/src/js/ClipInstance.js` (new — individual clip element)
- `mainframe/src/js/ClipList.js` (update rendering to use new elements)
- `mainframe/src/main.js` (integration)
- `mainframe/src/styles.css` (styling)
- `mainframe/test/ClipList.test.js` (update tests)

## Problem
The user wants the library page to display ALL clips grouped by their categories directly on the page, using a specific custom element structure. This replaces the folder navigation approach from Task 85 with an inline grouped view.

## Requirements
1. **Architecture**: Custom elements to group clips by category:
   ```html
   <clip-category>
     <clip-instance></clip-instance>
     <clip-instance></clip-instance>
   </clip-category>
   ```
2. **Display All Clips**: Render ALL clips, organized into their respective `<clip-category>` blocks. Even with many clips, all should be listed.
3. **Uncategorized Group**: Clips without a category go into a default "uncategorized" `<clip-category>`.
4. **Simplicity**: Keep it clean, flat, and minimalist per established design principles.

## Scope
- Create `ClipCategory` custom element (category header + clip container)
- Create `ClipInstance` custom element (individual clip display)
- Update `ClipList` to render grouped by category using new elements
- May replace or coexist with the folder navigation from Task 85
- Style new elements with flat, minimalist CSS
- Update tests

## Verification
- Run `npm run test -w mainframe` to ensure all tests pass
- Run `npm run lint` to ensure no lint errors

## Key Files
- `mainframe/src/js/ClipCategory.js` (new)
- `mainframe/src/js/ClipInstance.js` (new)
- `mainframe/src/js/ClipList.js`
- `mainframe/src/styles.css`

## Constraints
- **Vanilla JS only** — no frameworks
- **Avoid over-engineering** — simple grouped display
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- Task 85 (Clip Categories) — completed, provides the category data model
- Task 86 (Clip Naming) — in progress, related to clip creation workflow
