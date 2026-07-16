# AKVJ Test Audit & Fortification

Execute an exhaustive audit to discover and eliminate testing gaps in the codebase:

- **1. Baseline**: Run `npm run test` and `npm run test:visual`. Fix any immediately failing tests or underlying code.
- **2. Gap Analysis**: Audit `src/` and `scripts/` to identify untested critical paths, complex logic, or missing edge cases.
- **3. Test Generation**: Write new Vitest unit tests and visual regression tests to achieve full coverage on the identified gaps. Refactor existing flaky tests.
- **4. Code Resolution**: If new tests expose bugs, you MUST fix the underlying codebase. Ensure `npm run build` and `npm run clips` succeed afterwards.
- **5. Self-Evolution**: If you discover a new blind spot, missing test strategy, or configuration issue during this audit, you MUST permanently document it by updating this file (`\AKVJ\.agents\prompts\test-audit.prompt.md`).



## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
