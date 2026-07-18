# Team Update: Refactor piano-roll-keys into `<key-bed>` custom element

## Summary

I'd like to refactor the keys container inside `<piano-roll>` from a plain `<div class="piano-roll-keys">` into its own custom element, `<key-bed>`. Along with this, `<piano-key>` would be renamed to `<key>` (with the class `PianoKey` → `Key`).

### Current structure

```html
<piano-roll>
  <div class="piano-roll-keys">
    <piano-key data-note="0"></piano-key>
    <piano-key data-note="1"></piano-key>
    ...
  </div>
</piano-roll>
```

### Target structure

```html
<piano-roll>
  <key-bed>
    <key data-note="0"></key>
    <key data-note="1"></key>
    ...
  </key-bed>
</piano-roll>
```

The `<key-bed>` element should be a proper custom element — not just a styling wrapper. It owns the layout and scrolling behavior for the 128 keys and can encapsulate key-creation logic that currently lives in `PianoRoll.#render()`.

## Impact

- **`mainframe/src/js/PianoRoll.js`** — `#keysContainer` becomes a `<key-bed>` element; key creation and `#keys()` traversal move into `KeyBed`
- **`mainframe/src/js/PianoKey.js`** — Rename class to `Key`, custom element tag from `piano-key` → `key`
- **`mainframe/src/scss/PianoRoll.scss`** — `.piano-roll-keys` selectors become `key-bed` element selectors; `piano-key` selectors become `key`
- **`mainframe/src/scss/PianoKey.scss`** — All `piano-key` selectors become `key`
- **Tests** — Any references to `piano-key` / `PianoKey` in unit or e2e tests need updating
- **`AkvjMainframe.js`** — No changes expected (it talks to `<piano-roll>`, not the inner keys directly)

## Action Needed

1. **Create `KeyBed` custom element** (`mainframe/src/js/KeyBed.js`) — encapsulates the 128-key container with flex layout, horizontal scroll, and key instantiation
2. **Rename `PianoKey` → `Key`** — tag name `piano-key` → `key`, class `PianoKey` → `Key`, file `PianoKey.js` → `Key.js`
3. **Update `PianoRoll`** — replace `#keysContainer` div with `<key-bed>`; delegate key creation and lookup to `KeyBed`
4. **Update SCSS** — replace `.piano-roll-keys` and `piano-key` selectors with `key-bed` and `key`
5. **Update tests** — fix all references to old tag/class names
6. **Run `npm run lint && npm run test && npm run build`** to validate

## Notes

- The `key` tag name is very generic — worth discussing whether `<piano-key>` should be kept as-is and only the container becomes `<key-bed>`, or if both should be renamed. Open to suggestions.
- The `KeyBed` element could expose a `keys` getter and a `setMappedKeys()` method so `PianoRoll` doesn't need to iterate children manually.
- All existing custom-element conventions apply: private fields with `#`, bound handlers with `#bound` prefix, `connectedCallback` / `disconnectedCallback` lifecycle, event-based communication.
