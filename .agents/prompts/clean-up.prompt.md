# AKVJ Dead Code & Cleanup Checklist

Run this prompt to scan the codebase for cruft, dead code, and unnecessary artifacts. The goal is to keep the repository pristine, performant, and **extremely easy for humans to read and navigate**:

## 1. Performance & Memory Cruft (Zero-Allocation)
- **Inline Object/Array Allocations**: Actively hunt down and eliminate any code that creates new arrays (`[]`), objects (`{}`), or anonymous functions inside the `requestAnimationFrame` render loop (e.g., inside `advanceFrame`, `Renderer`, `LayerManager`). 
- **Garbage Collection Optimization**: Refactor inline allocations into pre-allocated, reusable instance properties (`#scratchBuffer = new Float32Array()`) to completely prevent GC stutters.

## 2. Dead Code Elimination
- **Unused Variables & Methods**: Scan for declared variables, helper functions, and private class methods (e.g., `#unusedMethod`) that are never called.
- **Unused Imports**: Identify and remove any ES6 imports that are no longer referenced in the file.
- **Unreachable Logic**: Find code paths that can never be executed (e.g., code following an unconditional `return`, or impossible `if/else` branches).
- **Unused Parameters**: Identify function or method arguments that are declared but never utilized in the function body.

## 3. Cruft & Comments
- **Commented-Out Code**: Delete blocks of commented-out code. (Preserve architectural comments, JSDoc, and explanations of complex logic).
- **Stale Logs**: Remove any leftover `console.log` or `console.debug` statements, *unless* they are explicitly wrapped in an `import.meta.env.DEV` check. Leave `console.error` and `console.warn` intact for actual error handling.

## 4. Structural Cleanup
- **Redundant Logic**: Look for overly complex nested conditionals that can be simplified, flattened with early returns, or removed entirely.
- **Orphaned Files**: Identify `.js` modules, scripts, or old JSON configurations that are never imported or accessed anywhere in the project.
- **Unused Dependencies**: Audit `package.json` for npm packages that are installed but no longer used in the build pipeline or source code.
- **Dead Config Fields**: Scan `settings.js` and similar configuration objects for fields that are defined but never referenced anywhere in the codebase. These often accumulate when features are refactored (e.g., `midi.channels`, `midi.notes`, `midi.velocity` were superseded by `channelMapping` but left behind).
- **Superseded Utility Modules**: Look for utility modules whose exports are only self-referenced (defined and used within the same file but never imported elsewhere). These can arise when downstream code is refactored to use inline constants or different patterns (e.g., `channel.js` exported `toCodeChannel`/`BITMASK_CHANNEL` but consumers defined their own local constants instead).

## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
