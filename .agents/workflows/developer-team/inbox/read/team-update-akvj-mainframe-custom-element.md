# Team Update: Wrap Mainframe in `<akvj-mainframe>` Custom Element

## Summary
We want to wrap the entire Mainframe UI in a single `<akvj-mainframe>` custom element. The goal is that the entire app is contained within this element, and how we use it in the future is up to that element's API.

The target HTML structure:

```html
<body>
  <akvj-mainframe>
  </akvj-mainframe>
</body>
```

The custom element should be registered as an extended built-in element (i.e., `customElements.define('akvj-mainframe', AkvjMainframe, { extends: 'body' })` or similar extended object element pattern).

## Impact
- Mainframe's `index.html` and entry point (`main.js`) will need to be restructured so the app lives inside `<akvj-mainframe>` instead of the current flat DOM structure.
- All existing Mainframe UI components and logic should be encapsulated within the custom element's shadow/light DOM.
- Future usage and integration of Mainframe will be driven by the `<akvj-mainframe>` element's API and attributes.

## Action Needed
- Create the `AkvjMainframe` custom element class that bootstraps the full Mainframe UI.
- Register it with `customElements.define()` using the extended object element pattern.
- Update `index.html` to use `<akvj-mainframe>` as the root container.
- Move existing initialization logic from `main.js` into the custom element's `connectedCallback` or equivalent lifecycle.

## Notes
- Follow the existing custom element patterns used in AKVJ (e.g., `<adventure-kid-video-jockey>`).
- Keep vanilla JS — no frameworks.
- File naming: PascalCase for the class file (e.g., `AkvjMainframe.js`).
