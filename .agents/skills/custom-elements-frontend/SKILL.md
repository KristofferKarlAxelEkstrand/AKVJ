---
name: custom-elements-frontend
description: >-
  Build and refactor AKVJ frontend UI with vanilla JS/CSS, light-DOM custom
  HTML elements, event-based communication, self-contained multi-instance
  components, and correct Custom Elements lifecycle hygiene. Prefer modern
  CSS features over extra libraries; do not use Shadow DOM for CSS.
  Use when working on Mainframe UI, Web Components, custom elements,
  connectedCallback/disconnectedCallback, component CSS/SCSS, piano roll,
  clip list/editor UI, or communication between UI pieces.
---

# Custom Elements Frontend (Light DOM)

Prefer platform custom elements over frameworks. Style and behavior stay on the element so pieces can be removed, reused, and instantiated many times.

**Vanilla JS and CSS first.** No React/Vue/Svelte or CSS-in-JS frameworks. Stay close to the platform. That said, **modern CSS is excellent** — use it when it earns its keep: nesting (or SCSS), custom properties, `:has()`, container queries, grid/flex, `color-mix()`, cascade layers, and similar. Prefer a good CSS solution over inventing JS layout/state just to style something.

House-style examples: `mainframe/src/js/ClipInstance.js`, `mainframe/src/js/StickyPianoRoll.js`.

For longer copy-paste tidbits, see [references/tips.md](references/tips.md).

## Defaults for this repo

1. **Vanilla JS + CSS/SCSS** — platform APIs only; lean on modern CSS features instead of extra libraries.
2. **Prefer custom HTML elements** (`extends HTMLElement`, `customElements.define`).
3. **No Shadow DOM** — no `attachShadow`. Light DOM + CSS/SCSS scoped under the host tag (one stylesheet per element; do not grow a global component CSS dump).
4. **Events between elements** — `CustomEvent` (usually `bubbles: true`) over tight parent/child method calls.
5. **Most code inside the element** — render, listeners, cleanup on the class; host page stays thin; many instances must work.

## Lifecycle (know this well)

| Hook | When | Do | Don't |
| --- | --- | --- | --- |
| `constructor` | Created | Cheap field init, bound handlers / `AbortController` | Touch children, treat attributes as ready, start async I/O |
| `connectedCallback` | In document | Render, attach listeners, start work | Assume once-only (can reconnect); leak window/document listeners |
| `disconnectedCallback` | Removed | Abort controllers, clear timers/rAF, drop subscriptions; `replaceChildren()` when appropriate | Assume destroyed forever (may reconnect) |
| `attributeChangedCallback` | Observed attr changes | Sync reflected config (`observedAttributes`) | Heavy work on every churn without debounce |
| `adoptedCallback` | Other document | Rare here — usually ignore | Rely on it for SPA navigation |

## Tips & snippets

### Global box model (allowed page baseline)

Use Paul Irish’s inherit pattern so padding is inside width, and a component can still opt out with `box-sizing: content-box` if needed ([Paul Irish — box-sizing border-box FTW](https://www.paulirish.com/2012/box-sizing-border-box-ftw/)):

```css
/* apply a natural box layout model to all elements, but allowing components to change */
html {
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: inherit;
}
```

This is one of the few intentional **global** rules. Component look-and-feel still belongs on the custom element’s own stylesheet.

### Light-DOM element skeleton

```js
/**
 * @fires MyWidget#change - CustomEvent with `{ detail: { value } }`
 */
class MyWidget extends HTMLElement {
  #value = '';
  #abort = null;

  connectedCallback() {
    this.#abort = new AbortController();
    const { signal } = this.#abort;
    this.#render();
    this.addEventListener('click', this.#onClick, { signal });
  }

  disconnectedCallback() {
    this.#abort?.abort();
    this.#abort = null;
    this.replaceChildren();
  }

  #onClick = () => {
    this.dispatchEvent(
      new CustomEvent('change', { bubbles: true, detail: { value: this.#value } })
    );
  };

  #render() {
    this.replaceChildren();
    // build light-DOM children with createElement / append
  }
}

customElements.define('my-widget', MyWidget);
export { MyWidget };
```

Why this shape: `AbortController` cleans listeners in one call; private fields keep multi-instance state on `this`; no module-level UI globals.

### Scope SCSS under the host tag

```scss
my-widget {
  display: block;

  .row {
    display: flex;
    gap: 0.5rem;
  }

  button {
    cursor: pointer;
  }
}
```

Not a growing `styles.css` full of `.row` / `.tab` used by every page.

### Listen up the tree

```js
parent.addEventListener('change', (event) => {
  if (!(event.target instanceof MyWidget)) return;
  const { value } = event.detail;
  // …
});
```

Parents react to events; they do not call into `#private` child state for routine flow.

## Anti-patterns

- Shadow DOM “for CSS”
- Dumping every component’s look into one global stylesheet
- Parking component logic in a grab-bag `main.js`
- Skipping disconnect cleanup
- Module singletons that break a second `<my-widget>` on the page
- Reaching into children with methods when an event would do

## Checklist

- [ ] Light DOM only (no `attachShadow`)
- [ ] Events + `@fires` for cross-element communication
- [ ] Connect sets up / disconnect tears down
- [ ] Safe with multiple instances
- [ ] Styles scoped to this element; global CSS stays at tiny baseline (box-sizing + minimal shell)
