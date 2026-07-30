---
title: Mainframe developer constraints and lessons
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/memory/mainframe-developer/memory.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

# Mainframe Developer Memory

This file serves as your persistent memory. Update it as you learn new constraints, patterns, or architecture rules specific to the `mainframe` application.

## Key Constraints
- **Primary Architectural Goal**: Decouple the `akvj` and `mainframe` applications as much as possible. You must ensure `mainframe` code does not inappropriately bleed into `akvj` code.
- Clip management and JSON metadata processing.
- Handles the UI and settings mapping.
- Focus exclusively on the `mainframe` test suite to verify your own work.

## Process Notes
- Before implementing a `[TASK]`, run `git status`/`git diff` on the target files first. A prior session may have already implemented (and tested) the work but exited before reaching the report-back step, leaving it uncommitted in the working tree. Verify against the spec + run tests rather than blindly re-implementing (happened with Task 186, keybed Phase 3 — code + tests were already complete).
- For single-file checks use `npm run test:unit -w mainframe -- test/Foo.test.js` (vitest.config.js only). Full `npm run test -w mainframe` chains three configs and is the CI gate — do not use it for one-file filters (Task 470).
