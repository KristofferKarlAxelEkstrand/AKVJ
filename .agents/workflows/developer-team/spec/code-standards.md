# Code Quality & Modularity Standards

In order to maintain a pristine, easily readable, and highly maintainable vanilla JavaScript codebase, all code generated in this project must strictly adhere to the following standards:

### 1. Architectural Modularity
- **Single Responsibility Principle (SRP)**: Keep functions and classes small and focused on exactly one responsibility. Do not enforce an arbitrary line-count limit — prioritize Single Level of Abstraction (SLAP). A linear, highly readable 50-line function is better than ten fragmented 5-line functions. Extract a helper when a function does multiple things, mixes levels of abstraction, or has deep nesting (`if/else` inside loops) — not because it crossed a line count.
- **Event-Driven Decoupling**: Use the `EventTarget` interface (e.g., the `AppState` bus) for loose coupling between disparate systems. Do not pass deep module references if a simple event dispatch will suffice.
- **Clear Interfaces**: Route cross-module behavior through explicit manager methods rather than mutating object properties directly.

### 2. Modern Vanilla JS & Custom Elements
- **Web Components First**: The frontend UI should be built extensively using Custom Elements and extended HTML elements. Wrap all UI components in native Web Components (`<custom-element>`) with proper lifecycle management (`connectedCallback`, `disconnectedCallback`, `attributeChangedCallback`). This ensures modularity without a framework.
- **Tag naming (mainframe)**: Use `akvj-*` only for top-level app shells that appear once in the page shell (today: `akvj-staging-preview`, `akvj-clip-list`, `akvj-mapping-table`). Use unprefixed tags for reusable leaf widgets (`clip-frames`, `clip-name-input`, `user-message`, `piano-roll`, …). Do **not** mass-rename existing tags for consistency; follow this rule for new elements so the mix does not grow.
- **Custom Event Communication**: Custom elements should communicate upwards exclusively via bubbling custom events (`this.dispatchEvent(new CustomEvent('action', { bubbles: true, composed: true, detail: {...} }))`). Do not tightly couple children to parents by passing down callback functions or manager references. Let the events bubble up to a controller.
- **Strict Encapsulation**: Use native `#privateFields` and `#privateMethods()` for all internal class state.
- **ES6+ Syntax**: Always use modern idioms like optional chaining (`?.`), nullish coalescing (`??`), logical assignment (`??=`), and modern array methods (`flatMap()`, `.at(-1)`).
- **Immutability First**: Prefer `const` over `let` in all scenarios. Never mutate function arguments.

### 3. Readability & Documentation
- **Descriptive Naming**: Use explicit, domain-specific names (`layerGroup`, `effectsManager`) instead of vague terms (`data`, `state`, `thing`). 
- **Magic Numbers**: Extract all magic numbers and string literals into clearly named `const` variables at the top of the file or in a shared `constants.js` file.
- **JSDoc Types**: Use standard JSDoc (`@param`, `@returns`, `@typedef`) for all public-facing API methods to provide rich IDE intellisense without needing TypeScript.
- **Comment the "Why"**: Code tells you *what* it does; comments should explain *why* complex decisions were made.

### 4. Robustness
- **Early Returns**: Use guard clauses to check for null/undefined parameters at the top of functions to reduce nested conditionals.
- **Safe Event Listeners**: Always cache `.bind(this)` methods so event listeners can be cleanly removed during teardown.
- **Graceful Error Handling**: Wrap fragile cleanup and parsing logic in focused `try/catch` blocks.
