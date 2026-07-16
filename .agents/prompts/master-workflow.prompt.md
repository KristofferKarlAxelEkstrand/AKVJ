# Master Workflow: Codebase Overhaul

This is the central orchestrator prompt. Run this to execute a comprehensive, full-scale audit and cleanup of the codebase. You MUST execute these workflows sequentially. Do not move to the next step until the previous one is fully completed and successful.

## Execution Sequence

### Phase 1: Cognitive Simplification
Read from disk and execute: `C:\github\adventurekid-harness\live\AKVJ\.agents\prompts\simplify-and-make-easy-to-understand.prompt.md`
*Goal: Flatten logic, extract complexity, and make the code incredibly easy for humans to read.*

### Phase 2: Domain Consistency
Read from disk and execute: `C:\github\adventurekid-harness\live\AKVJ\.agents\prompts\naming-standards-and-consistency.prompt.md`
*Goal: Enforce strict VJ terminology and naming conventions.*

### Phase 3: Cruft Elimination
Read from disk and execute: `C:\github\adventurekid-harness\live\AKVJ\.agents\prompts\clean-up.prompt.md`
*Goal: Strip out all dead code, unused dependencies, and orphaned logic.*

### Phase 4: Validation & Pipeline
Read from disk and execute: `C:\github\adventurekid-harness\live\AKVJ\.agents\prompts\lint-test-and-fix.prompt.md`
*Goal: Ensure the project formatting is flawless and all tests pass with zero errors.*

---

## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to orchestrate this master workflow, update this `.prompt.md` file to permanently document your findings.
