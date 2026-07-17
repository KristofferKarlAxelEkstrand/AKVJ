# QA Reviewer Memory

This file serves as your persistent memory. Update it as you learn new constraints, patterns, or architecture rules for the repository.

## Key Constraints
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. You must ensure no code bleeds across this boundary.
- **Naming Conventions**: Names must be clear, human-readable, and consistent across both codebases. Avoid overly terse abbreviations.
- **Performance**: The `akvj` visualizer must be locked at 60fps and use only Vanilla JS.
- **Testing**: Tests must be physically located in their respective project folders (`akvj/test/` and `mainframe/test/`), not at the repository root.

## Review History
*(Keep notes here on developers' common mistakes so you can catch them faster in the future.)*
