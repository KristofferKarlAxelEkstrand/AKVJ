# Custom elements — tips & tidbits

Small patterns that pair well with light-DOM custom elements in this repo. Keep `SKILL.md` as the policy; use this file when you need a concrete snippet.

**Stack taste:** vanilla JS and CSS/SCSS. No UI frameworks. Modern CSS (nesting, custom properties, `:has()`, container queries, grid/flex, etc.) is encouraged when it keeps the JS thinner.

## Box-sizing baseline (Paul Irish)

Natural width includes padding/border; components can still override via inheritance ([source](https://www.paulirish.com/2012/box-sizing-border-box-ftw/)):

```css
/* apply a natural box layout model to all elements, but allowing components to change */
html {
  box-sizing: border-box;
}
*, *:before, *:after {
  box-sizing: inherit;
}
```

Opt a stubborn third-party or legacy island back out:

```css
.legacy-widget,
.legacy-widget *,
.legacy-widget *::before,
.legacy-widget *::after {
  box-sizing: content-box;
}
```

## AbortController for listener cleanup

Prefer one controller per connect cycle instead of storing every bound function:

```js
connectedCallback() {
  this.#abort = new AbortController();
  const { signal } = this.#abort;
  window.addEventListener('keydown', this.#onKeyDown, { signal });
  this.addEventListener('pointerdown', this.#onPointerDown, { signal });
}

disconnectedCallback() {
  this.#abort?.abort();
  this.#abort = null;
}
```

## Guard double-connect

If the element can be moved in the DOM:

```js
connectedCallback() {
  if (this.#connected) return;
  this.#connected = true;
  // setup…
}

disconnectedCallback() {
  if (!this.#connected) return;
  this.#connected = false;
  // teardown…
}
```

## Reflect a simple attribute

```js
static get observedAttributes() {
  return ['channel'];
}

attributeChangedCallback(name, _old, value) {
  if (name === 'channel') {
    this.#channel = Number(value) || 1;
    if (this.isConnected) this.#render();
  }
}

get channel() {
  return this.#channel;
}

set channel(value) {
  this.setAttribute('channel', String(value));
}
```

## Re-render without thrashing

When data changes often, update in place if the shell already exists (see sticky piano roll’s `#hasRenderedKeys` pattern) instead of always `replaceChildren()` + full rebuild.

## Event naming

- Lowercase, no `on` prefix: `clipedit`, `stickykeyclick`, `framesreordered`
- Put identifiers in `detail`, not in the event type string
- Document with `@fires ClassName#eventname`

## What stays global vs per element

| Global (tiny) | Per custom element |
| --- | --- |
| box-sizing inherit | Layout, colors, chrome for that widget |
| `body` margin / font if needed | Buttons, keys, lists inside the host |
| CSS variables on `:root` if shared tokens help | Everything that makes the component “look like itself” |

If deleting the custom element from the page should remove its look, that CSS belonged on the element — not in a general stylesheet.
