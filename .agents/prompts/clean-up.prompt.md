# AKVJ Dead Code & Cleanup Checklist

Run this prompt to scan the codebase for cruft, dead code, and unnecessary artifacts that should be removed to keep the repository pristine and performant:

## 1. Dead Code Elimination
- **Unused Variables & Methods**: Scan for declared variables, helper functions, and private class methods (e.g., `#unusedMethod`) that are never called.
- **Unused Imports**: Identify and remove any ES6 imports that are no longer referenced in the file.
- **Unreachable Logic**: Find code paths that can never be executed (e.g., code following an unconditional `return`, or impossible `if/else` branches).
- **Unused Parameters**: Identify function or method arguments that are declared but never utilized in the function body.

## 2. Cruft & Comments
- **Commented-Out Code**: Delete blocks of commented-out code. (Preserve architectural comments, JSDoc, and explanations of complex logic).
- **Stale Logs**: Remove any leftover `console.log` or `console.debug` statements, *unless* they are explicitly wrapped in an `import.meta.env.DEV` check. Leave `console.error` and `console.warn` intact for actual error handling.

## 3. Structural Cleanup
- **Redundant Logic**: Look for overly complex nested conditionals that can be simplified, flattened with early returns, or removed entirely.
- **Orphaned Files**: Identify `.js` modules, scripts, or old JSON configurations that are never imported or accessed anywhere in the project.
- **Unused Dependencies**: Audit `package.json` for npm packages that are installed but no longer used in the build pipeline or source code.
