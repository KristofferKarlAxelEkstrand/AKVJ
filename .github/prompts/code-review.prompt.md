# Code Review

Review the code thoroughly and provide actionable feedback.

**Keep it simple.** Prefer straightforward solutions over clever ones.

**Keep it modern.** Use current JavaScript features and browser APIs.

## Review Checklist

### Correctness

- Logic errors or bugs
- Edge cases not handled
- Null/undefined safety

### Performance

- Unnecessary allocations in hot paths (render loops, event handlers)
- Repeated property access that could be cached
- Memory leaks (event listeners not cleaned up)

### Readability

- Clear variable and function names
- Appropriate comments for complex logic
- Consistent code style

### Simplicity

- Overly complex solutions
- Redundant code or unnecessary nesting
- Code that could be simplified

### Modern JavaScript

- Use of `const` over `let` where possible
- Modern syntax: `?.`, `??`, `??=`, `for...of`, destructuring
- Private class fields `#fieldName` for encapsulation
- Use `performance.now()` for timing, not `Date.now()`

### Error Handling

- Individual try-catch blocks in cleanup methods
- Guard clauses for early returns
- Meaningful error messages with context

## AKVJ-Specific Concerns

- **60fps rendering**: No blocking operations in render loop
- **<20ms MIDI latency**: Keep MIDI handlers fast
- **Proper cleanup**: `dispose()`, `destroy()`, `disconnectedCallback()`
- **Vanilla JS only**: No frameworks
- **Custom HTML elements**: Prefer custom elements with proper lifecycle methods (`connectedCallback`, `disconnectedCallback`)
- **Custom events**: Prefer `CustomEvent` and `EventTarget` for inter-module communication (loose coupling)
- **Unsubscribe pattern**: `subscribe()` methods should return an unsubscribe function
- **HMR support**: Include cleanup in `import.meta.hot.dispose()` for hot module replacement

## Output Format

1. List issues found with file and line reference
2. Explain why each is a problem
3. Provide a fix or suggestion

## Final Step

After addressing review feedback and pushing your changes locally, please push your branch to the PR remote and request Copilot review using MCP.

- Push your updated branch:
    ```bash
    git push origin YOUR_BRANCH
    ```
- Request Copilot review via MCP (example pseudo-call):
  `js
mcp_io_github_git_request_copilot_review({ owner: 'KristofferKarlAxelEkstrand', repo: 'AKVJ', pullNumber: 34 });
`
  Confirm CI passes before marking the PR ready for merge.
