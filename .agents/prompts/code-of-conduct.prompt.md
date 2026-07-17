# AKVJ Code of Conduct

Strictly adhere to these rules. **The ultimate goal is highly readable code for humans that is easy to edit and work with.** Prioritize vanilla JS performance, robust error handling, strict encapsulation, and extremely clean patterns:

- **1. Core Architecture**: NO frameworks (React, Vue, Tailwind). Use ONLY Vanilla JS and CSS. The `akvj` render loop MUST hit 60fps and process MIDI with <20ms latency. No blocking operations.
- **2. High-Performance Engine (Zero-Allocation)**: To prevent Garbage Collection (GC) stutters, **never allocate objects or arrays inside the `requestAnimationFrame` render loop**. Re-use pre-allocated objects and scratch buffers. Enforce integer coordinates (`Math.floor`) to avoid sub-pixel anti-aliasing overhead. Batch Canvas state changes (e.g., group by `fillStyle`).
- **3. Separation of Concerns**: Strictly separate the **Update logic** (physics, timings, MIDI state) from the **Render logic** (Canvas drawing calls). Do not mix them.
- **4. Privacy & Scope**: Use native `#` for ALL private fields/methods. Ban `_` prefixes. No global scope pollution; use ES6 modules exclusively. Components must decouple via `AppState` (EventTarget) instead of tight coupling.
- **5. Naming**:
  - **Booleans**: `isX`, `hasX`, `shouldX`, `canX`. Ban `playing` or `active`.
  - **Methods**: Use action verbs (`drawX`, `updateX`).
  - **Handlers**: `handleX` or `#boundHandleX`.
  - **Optimization buffers**: `_scratchX` or `bufferX`.
  - **Banned**: Hungarian notation (`arrX`) and jQuery DOM prefixes (`$X`).
- **6. Lifecycle & Cleanup**: Use `setup()` and `destroy()`. Enforce the **Unsubscribe Pattern** (cache `#bound` handlers, push to `#unsubscribers`, invoke all in `destroy()`). Wrap individual cleanups in `try-catch`. When `destroy()` has multiple independent cleanup blocks, extract them into focused `#destroyX()` helpers (e.g., `#destroyLayerGroups()`, `#removeDOMListeners()`) to keep the main `destroy()` function acting as a high-level orchestrator rather than a massive wall of logic.
- **7. Syntax & Readability**: Use `??=`, `.at(-1)`, `?.`, and `flatMap()`. Prefer `const`. Extract magic numbers to `UPPER_SNAKE_CASE`. Use `performance.now()` for timing, NEVER `Date.now()`. **Function Length**: Do not enforce arbitrary line limits. Instead, prioritize Single Responsibility and Single Level of Abstraction (SLAP). If a function does multiple things or has deep nesting (`if/else` inside loops), extract `#private` helpers with descriptive domain names. A linear, highly readable 50-line function is better than ten fragmented 5-line functions. Shared logic between similar methods must be extracted into a single helper. For procedural (non-class) modules, extract standalone named functions (`buildClipEntry`, `routeRequest`) instead of `#private` syntax.
- **8. Debugging**: Wrap `console.log` in `if (import.meta.env.DEV)`.
- **9. Evolve Prompt**: If you discover a new rule or missing pattern, update this `.prompt.md` file.

## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
