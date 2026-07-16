# AKVJ Simplicity & Clarity Refactor

Run this prompt to refactor the codebase for maximum readability, cognitive ease, and structural order. **The ultimate goal is highly readable code for humans that is easy to work with and edit.** While refactoring, actively find errors, fix bugs, and ensure the code runs robustly. (Ensure your refactors strictly follow `code-of-conduct.prompt.md`).

## 1. Cognitive Simplicity & Architecture
- **Single Level of Abstraction (SLAP)**: Functions must orchestrate *or* execute, never both. High-level functions should read like a table of contents calling domain-specific `#private` helpers.
- **Separation of Concerns (Update vs Render)**: The codebase is a 60fps engine. **Never** mix state mutations/physics/math with Canvas drawing calls. They must be isolated.
- **Flatten Logic**: Eliminate deeply nested `if/else` loops. Use guard clauses and early returns.
- **Smart but Simple**: Prefer highly readable, linear JavaScript over "clever" one-liners. Code should be boring to read.

## 2. Structural Order
- **Group Related State**: If a class has a massive list of properties, organize them logically, or extract complex state into its own class/object.
- **File & Folder Clarity**: If a module has grown too large and is doing too many things, extract independent utilities into their own clearly named files in the appropriate folder (e.g., separating math helpers into `/utils/`).
- **Lifecycle Clarity**: Ensure `setup()` and `destroy()` are the undeniable, highly readable entry and exit points of any class.

## 3. Self-Documenting Code
- **Expressive Naming**: Ensure variables and methods describe exactly *what* they do.
- **Meaningful Comments**: Delete comments that just explain *what* the code is doing (the code should be simple enough to explain itself). Only leave comments that explain *why* a specific architectural decision or complex math calculation was made.

## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
