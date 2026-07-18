---
status: in-review
assignee: qa-reviewer
priority: medium
---

# Task 204: Refactor piano-roll-keys into `<key-bed>` Custom Element

## Source
`.agents/workflows/developer-team/inbox/read/refactor-key-bed-custom-element.md`
(Human feature request)

## Scope
Refactor the keys container inside `<piano-roll>` from a plain `<div class="piano-roll-keys">` into its own `<key-bed>` custom element. Rename `<piano-key>` to `<key>` (class `PianoKey` → `Key`).

## Target structure
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

## Checklist

1. **Create `KeyBed` custom element** (`mainframe/src/js/KeyBed.js`)
   - Encapsulates the 128-key container with flex layout, horizontal scroll, and key instantiation
   - Expose a `keys` getter and a `setMappedKeys()` method so `PianoRoll` doesn't need to iterate children manually
   - Private fields with `#`, bound handlers with `#bound` prefix, `connectedCallback` / `disconnectedCallback` lifecycle

2. **Rename `PianoKey` → `Key`**
   - Tag name `piano-key` → `key`, class `PianoKey` → `Key`, file `PianoKey.js` → `Key.js`
   - **Note**: The `key` tag name is very generic — if this causes concerns, keep `<piano-key>` as-is and only create `<key-bed>`. Use your judgment.

3. **Update `PianoRoll`** (`mainframe/src/js/PianoRoll.js`)
   - Replace `#keysContainer` div with `<key-bed>`
   - Delegate key creation and lookup to `KeyBed`

4. **Update SCSS**
   - `mainframe/src/scss/PianoRoll.scss` — `.piano-roll-keys` selectors become `key-bed` element selectors; `piano-key` selectors become `key`
   - `mainframe/src/scss/PianoKey.scss` — All `piano-key` selectors become `key` (rename file to `Key.scss` if class is renamed)

5. **Update tests** — Fix all references to old tag/class names

6. **`AkvjMainframe.js`** — No changes expected (it talks to `<piano-roll>`, not the inner keys directly)

## Files
- `mainframe/src/js/KeyBed.js` (new)
- `mainframe/src/js/Key.js` (renamed from `PianoKey.js`)
- `mainframe/src/js/PianoRoll.js`
- `mainframe/src/scss/PianoRoll.scss`
- `mainframe/src/scss/Key.scss` (renamed from `PianoKey.scss`)
- `mainframe/test/` — any tests referencing `piano-key` / `PianoKey`

## Notes
- All existing custom-element conventions apply: private fields with `#`, bound handlers with `#bound` prefix, `connectedCallback` / `disconnectedCallback` lifecycle, event-based communication
- Light DOM (no Shadow DOM) per AKVJ conventions

## Verification
`npm run lint && npm run test && npm run build`
