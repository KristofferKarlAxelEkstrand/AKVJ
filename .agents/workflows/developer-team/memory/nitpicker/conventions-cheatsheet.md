# The Nitpicker — Conventions Cheatsheet

Distilled from `../../spec/code-standards.md` and `AGENTS.md`. Keep this current; it's my fast
reference during sweeps.

## Naming
- **Files**: PascalCase when the main export is a class (`Renderer.js`, `Compositor.js`); lowercase
  otherwise (`settings.js`, `velocitySelection.js`). Applies to `src/` and `scripts/` alike.
- **File ↔ class**: `Foo.js` should export `Foo` (flag `Foo.js` exporting `AkvjFoo`, etc.).
- **Private**: `#fieldName` / `#methodName()` for all internal state and helpers.
- **Domain names over vague ones**: `layerGroup`, `effectsManager`, `compositor`, `midiAccess` —
  never `data`, `state`, `thing`.
- **Constants** for repeated strings and event names, centralized so intent is obvious.
- **Units in names** where ambiguous (`durationMs`, `beatsPerBar`).

## Semantics
- Names must be honest: `enqueue` should enqueue, `isX` should be boolean-true-when-X, `handle*`
  shouldn't secretly mutate/dispatch beyond handling.
- One concept, one term across the codebase (watch `fps`/`frameRate`/`rate` drift).
- Event names: pick one convention per realm and keep it (camelCase past-tense on the state bus vs
  lowercase DOM events is a known split-brain to watch).

## Custom elements
- One documented tag-prefix rule (e.g. `akvj-*` for app chrome, unprefixed for leaf widgets) —
  applied consistently. Custom events upward: `{ bubbles: true, composed: true }`.

## Readability
- No narrating comments (`// increment counter`). Comments explain non-obvious intent only.
- JSDoc on public methods should match reality.
- Magic values → named constants.

## Human-first
- Don't let names/format make the code or on-disk clip JSON harder for a human to read
  (`clip-schema.md` Golden Rule).
