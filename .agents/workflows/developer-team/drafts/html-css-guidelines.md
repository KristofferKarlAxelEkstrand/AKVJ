# HTML / CSS / JS Guidelines

## 1. Prefer custom elements

Use custom elements (`extends HTMLElement`, `customElements.define`). They own their own lifecycle (`connectedCallback`, `disconnectedCallback`, and friends), which keeps setup and teardown local to the component and easy to reason about.

```js
class MyWidget extends HTMLElement {
  connectedCallback() {
    // in the document — render, attach listeners, start work
  }

  disconnectedCallback() {
    // removed — tear down listeners, timers, subscriptions
  }
}

customElements.define('my-widget', MyWidget);
```

## 2. One SCSS file per custom element

Each custom element gets its own stylesheet, named to match (e.g. `MyWidget.js` ↔ `MyWidget.scss`, or `my-widget.js` ↔ `my-widget.scss`). Scope styles under the host tag so look-and-feel stays with the component — simple, restricted, and easy to find.

```scss
my-widget {
  display: block;

  .row {
    display: flex;
    gap: 0.5rem;
  }
}
```

## 3. Communicate with events

Elements talk to each other via `CustomEvent` (usually `bubbles: true`), not by reaching into each other's methods or private state. Parents listen; children dispatch.

```js
// child
this.dispatchEvent(
  new CustomEvent('change', { bubbles: true, detail: { value: this.#value } })
);

// parent
parent.addEventListener('change', (event) => {
  if (!(event.target instanceof MyWidget)) return;
  const { value } = event.detail;
});
```

## 4. No component CSS on `html` / `body`

Do not park look-and-feel on `html` or `body`. Those belong to the page shell only (e.g. margin, font on `body`). Component styles live on the custom element's own SCSS — not dumped at the root.

## 5. CSS variables on `:root`

Shared tokens live on `:root` as CSS custom properties. Collect them there with clear, consistent names so components can reuse them without hardcoding values.

```css
:root {
  --color-bg: #111;
  --color-text: #eee;
  --space-sm: 0.5rem;
  --space-md: 1rem;
}
```

## 6. No Shadow DOM

Light DOM only — do not call `attachShadow`. Shared CSS, `:root` tokens, and host-page theming stay available; each element still scopes its look in its own SCSS under the host tag.

## 7. Connect / disconnect hygiene

Set up in `connectedCallback`, tear down in `disconnectedCallback` (listeners, timers, `AbortController`). The element can reconnect, so do not assume setup runs once forever.

## 8. Safe with multiple instances

No module-level UI singletons. Keep state on `this` / `#private` fields so many instances of the same element work side by side.

## 9. Global box-sizing only

The one intentional global layout rule (alongside `:root` tokens) is Paul Irish’s inherit pattern — padding stays inside width, and a component can still opt out with `box-sizing: content-box` if needed.

```css
html {
  box-sizing: border-box;
}
*,
*:before,
*:after {
  box-sizing: inherit;
}
```

## 10. Vanilla JS + modern CSS

No frameworks. Prefer CSS for layout and style (nesting, `:has()`, grid/flex, custom properties) over inventing JS for the same job. SCSS is fine — it’s close to CSS and keeps component styles easy to write and nest under the host tag.

## 11. Document events with `@fires`

Add JSDoc `@fires` on the class so parents know what bubbles up and what’s in `detail`.

```js
/**
 * @fires MyWidget#change - CustomEvent with `{ detail: { value } }`
 */
class MyWidget extends HTMLElement {
  // …
}
```

## 12. Constructor stays cheap

Field init and bound handlers only in the `constructor`. Do not touch children or attributes until `connectedCallback`.
