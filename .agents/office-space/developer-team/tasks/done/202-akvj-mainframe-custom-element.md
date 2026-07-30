---
status: done
assignee: mainframe-developer
priority: high
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 202: Wrap Mainframe in `<akvj-mainframe>` Custom Element

## Source
`.agents/workflows/developer-team/inbox/read/team-update-akvj-mainframe-custom-element.md`
(Human feature request)

## Scope
Wrap the entire Mainframe UI in a single `<akvj-mainframe>` custom element. The entire app should be contained within this element, with future usage driven by the element's API and attributes.

## Checklist

1. **Create `AkvjMainframe` custom element class**
   - File: `mainframe/src/js/AkvjMainframe.js` (PascalCase per naming convention)
   - Class `AkvjMainframe` that bootstraps the full Mainframe UI.
   - Register with `customElements.define('akvj-mainframe', AkvjMainframe, { extends: 'body' })` or similar extended built-in element pattern.
   - Move existing initialization logic from `main.js` into the custom element's `connectedCallback` or equivalent lifecycle.

2. **Update `index.html`**
   - Target structure:
     ```html
     <body>
       <akvj-mainframe>
       </akvj-mainframe>
     </body>
     ```
   - Remove flat DOM structure; app lives inside `<akvj-mainframe>`.

3. **Encapsulate existing UI components and logic**
   - All existing Mainframe UI components and logic should be encapsulated within the custom element.
   - Follow existing custom element patterns used in AKVJ (e.g., `<adventure-kid-video-jockey>`).
   - Keep vanilla JS — no frameworks.
   - Use light DOM (no Shadow DOM) per AKVJ conventions.

4. **Update `main.js` entry point**
   - Remove direct DOM manipulation / initialization that now lives in the custom element.
   - Entry point should just register the element and let it bootstrap.

## Files
- `mainframe/src/js/AkvjMainframe.js` (new)
- `mainframe/index.html`
- `mainframe/src/js/main.js`
- Any existing components that need to be re-parented into the custom element

## Notes
- Follow the existing custom element patterns used in AKVJ (e.g., `<adventure-kid-video-jockey>`).
- Keep vanilla JS — no frameworks.
- File naming: PascalCase for the class file (e.g., `AkvjMainframe.js`).
- Use private fields (`#`) for internal state per AKVJ conventions.

## Verification
`npm run lint && npm run test && npm run build`
