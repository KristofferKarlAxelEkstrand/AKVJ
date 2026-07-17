# AKVJ Developer Memory

This file serves as your persistent memory. Update it as you learn new constraints, patterns, or architecture rules specific to the `akvj` visualizer.

## Key Constraints
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. You must ensure `akvj` code does not inappropriately bleed into `mainframe` code.
- Must maintain 60fps locked rendering.
- Vanilla JS only (no frameworks).
- Use Web MIDI API efficiently.
- Focus exclusively on the `akvj` test suite to verify your own work.
