Enforce strict AKVJ Code Quality & Modernization rules:
- **Hard Privacy**: Use `#` for all private fields and methods. Ban `_` prefixes.
- **Modern Syntax**: Use `??=` for default assignments, `.at(-1)`, `?.`, and `flatMap()`.
- **Timing**: Ban `Date.now()`. Use `performance.now()` for all high-resolution animation timing.
- **Event Subscriptions**: Use the Unsubscribe Pattern. Cache `#bound` handlers, push them to an `#unsubscribers` array, and loop through them in `destroy()`.
- **Lifecycle Methods**: Use `setup()` (never `setUp()`) and `destroy()` (never `dispose()`, `clear()`, or `remove()`).
- **Robust Cleanup**: Inside `destroy()`, wrap individual resource cleanups in isolated `try-catch` blocks to prevent cascading failures.
- **Dev-Only Logging**: Wrap all `console.log` statements in `if (import.meta.env.DEV)` checks to keep production clean.
- **Clean Code**: Prefer `const` over `let`. Extract magic numbers to `UPPER_SNAKE_CASE` constants. Keep functions under 20 lines.
