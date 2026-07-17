# Task 34b: Move Mainframe Tests into mainframe/test/

## Objective
Move all clip management / UI related tests from the root test suite into `mainframe/test/` to decouple testing from the akvj visualizer.

## Sub-tasks

### 1. Analyze Existing Tests
- Review current tests in the root `test/` directory (if any remain there)
- Review existing `mainframe/test/` directory
- Identify all tests related to: clip management, image processing, generation, validation, UI mapping, smoke tests

### 2. Move Mainframe Tests
- Move identified tests into `mainframe/test/` directory
- Update import paths in moved test files
- Ensure `mainframe/package.json` has a `test` script that runs only these tests
- Update `mainframe/vitest.config.js` if needed for new test locations

### 3. Cleanup Root Test Suite
- Once all tests are successfully migrated to both `akvj/test/` and `mainframe/test/`, remove the monolithic root `test/` directory if it exists
- Update root `package.json` test scripts if needed

### 4. Verify
- Run `npm run test -w mainframe` to ensure all moved tests pass
- Ensure no akvj tests are accidentally included

## Key Files
- `mainframe/test/` — target directory (already has some tests)
- `mainframe/package.json` — workspace package.json
- `mainframe/vitest.config.js` — test configuration
- Root `test/` — to be cleaned up after migration
- Root `package.json` — test scripts may need updating

## Constraints
- Do NOT move akvj tests — only mainframe tests
- Coordinate with Task 34a (akvj dev) for root `test/` cleanup — only delete root test dir when BOTH are done
- Ensure all moved tests pass before reporting complete
- Run `npm run lint && npm run test -w mainframe` before reporting

## Dependencies
- Should be done in parallel with Task 34a
- Root `test/` cleanup requires both 34a and 34b to be complete
