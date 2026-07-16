# Lint, Test, and Fix

Your task is to ensure the codebase is perfectly formatted, highly readable, passes all linting rules, and passes all tests. Actively find errors, fix underlying bugs, and guarantee the code works robustly. 

Execute the following steps sequentially. If ANY step fails, you must stop, investigate the error, fix the underlying code, and re-run the failing command until it passes successfully before moving to the next step.

## 1. Format
Run the auto-formatters to fix styling issues:
- `npm run format:prettier`
- `npm run format:stylelint`

## 2. Lint
Run the linters to catch and auto-fix code quality issues:
- `npm run lint:fix`
- *If any errors or warnings remain that could not be auto-fixed, manually resolve them.*

## 3. Test
Run the test suites to ensure no regressions:
- `npm run test` (Unit tests)
- `npm run test:visual` (Visual regression tests. *Note: Skip this step if you are running inside a headless dev container as it requires Chromium*).

## 4. Build
Verify the project compiles successfully:
- `npm run build`

**Goal**: Do not complete your task until all applicable steps above execute with zero errors.

## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
