# Mainframe Developer Memory

This file serves as your persistent memory. Update it as you learn new constraints, patterns, or architecture rules specific to the `mainframe` application.

## Key Constraints
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. You must ensure `mainframe` code does not inappropriately bleed into `akvj` code.
- Clip management and JSON metadata processing.
- Handles the UI and settings mapping.
- Focus exclusively on the `mainframe` test suite to verify your own work.
