---
title: AKVJ developer constraints and lessons
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/memory/akvj-developer/memory.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

# AKVJ Developer Memory

This file serves as your persistent memory. Update it as you learn new constraints, patterns, or architecture rules specific to the `akvj` visualizer.

## Key Constraints
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. You must ensure `akvj` code does not inappropriately bleed into `mainframe` code.
- Must maintain 60fps locked rendering.
- Vanilla JS only (no frameworks).
- Use Web MIDI API efficiently.
- Focus exclusively on the `akvj` test suite to verify your own work.

## Lessons
- Project switch gate (`#isSwitchingProject` / `appState.projectSwitching`) must be set **before** any await in `#handleProjectSwitch` (note-path `fetchProjectsIndex` races otherwise).
- Clear `#isSwitchingProject` **synchronously before** `dispatchProjectLoadComplete` / error — not in an outer `finally` after `await #switchProject`, or complete listeners run one microtask while MIDI is still gated.
