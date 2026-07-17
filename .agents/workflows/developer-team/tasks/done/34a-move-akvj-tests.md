# Task 34a: Move AKVJ Tests into akvj/test/

## Objective
Move all visualizer-related tests from the root test suite into `akvj/test/` to decouple testing from the mainframe application.

## Sub-tasks

### 1. Analyze Existing Tests
- Review current tests in the root `test/` directory (if any remain there)
- Review existing `akvj/test/` directory
- Identify all tests related to: canvas rendering, MIDI ingestion, clip playback, 60fps loop, visual regression

### 2. Move AKVJ Tests
- Move identified tests into `akvj/test/` directory
- Update import paths in moved test files
- Ensure `akvj/package.json` has a `test` script that runs only these tests
- Update `akvj/vitest.config.js` if needed for new test locations

### 3. Verify
- Run `npm run test -w akvj` to ensure all moved tests pass
- Ensure no mainframe tests are accidentally included

## Key Files
- `akvj/test/` — target directory (already has some tests)
- `akvj/package.json` — workspace package.json
- `akvj/vitest.config.js` — test configuration
- `akvj/vitest.visual.config.js` — visual test configuration

## Constraints
- Do NOT move mainframe tests — only AKVJ visualizer tests
- Ensure all moved tests pass before reporting complete
- Run `npm run lint && npm run test -w akvj` before reporting

## Dependencies
- None (can be done independently of Task 34b)
