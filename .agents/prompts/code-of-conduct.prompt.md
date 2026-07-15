# AKVJ Code of Conduct

You are contributing to the AKVJ codebase. You must strictly adhere to the following rules at all times. Prioritize vanilla JavaScript performance, strict encapsulation, and modern, clean code patterns.

## 1. Encapsulation & Privacy
- **Strict Privacy**: Use native `#` for all private fields and methods. Ban `_` prefixes completely.
- **No Globals**: Avoid polluting the global scope. Use ES6 modules exclusively.

## 2. Naming Conventions
- **Booleans**: Enforce `isX`, `hasX`, `shouldX`, or `canX` (e.g., `isPlaying`). Ban ambiguous states like `playing` or `active`.
- **Event Handlers**: Enforce `handleX` (e.g., `#handleMidiNoteOn`). When caching bound handlers, prefix with `bound` (e.g., `#boundHandleMidiNoteOn`).
- **Verbs**: Use clear, specific action prefixes for methods (`drawX`, `renderX`, `updateX`, `setX`, `getX`).
- **Banned Prefixes**: Ban Hungarian notation (e.g., `strName`, `arrClips`) and jQuery-style DOM prefixes (e.g., `$canvas`). Use clean domain names instead (e.g., `#canvasElement`).

## 3. Lifecycle & Memory Management
- **Lifecycle Methods**: Use `setup()` (never `setUp()`) for initialization, and `destroy()` (never `dispose()`, `clear()`, or `remove()`) for teardown.
- **Event Subscriptions**: Enforce the **Unsubscribe Pattern**. Cache `#bound` handlers, push their unsubscription callbacks to an `#unsubscribers` array, and invoke all of them inside `destroy()`.
- **Robust Cleanup**: Inside `destroy()`, wrap individual resource cleanups in isolated `try-catch` blocks to prevent cascading failures.

## 4. Syntax & Performance
- **Modern JavaScript**: Utilize modern operators where appropriate: `??=` for default assignments, `.at(-1)` for array tails, `?.` for optional chaining, and `flatMap()`.
- **Clean Code**: Prefer `const` over `let`. Extract magic numbers to `UPPER_SNAKE_CASE` constants. Keep functions focused and under 20 lines where possible.
- **Timing**: Ban `Date.now()`. Use `performance.now()` exclusively for all high-resolution clip and render loop timing.

## 5. Debugging
- **Dev-Only Logging**: Wrap all `console.log` statements in `if (import.meta.env.DEV)` checks to ensure production builds remain pristine and silent.
