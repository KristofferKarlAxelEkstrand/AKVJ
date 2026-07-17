# Task 35: Delete Legacy Root Directories

## Objective
Remove dead legacy directories from the repository root that predate the monorepo split.

## Verified Findings
- **Root `test/`**: Contains only an empty `fixtures/` folder — no actual test files
- **Root `src/`**: Contains `src/public/clips/` with duplicate clip data. The build pipeline (`mainframe/scripts/clips/index.js`) correctly outputs to `akvj/src/public/clips/` — the root `src/` is NOT used by any build script.

## Sub-tasks

### 1. Delete Root `test/` Directory
- `rm -rf test/` from the repository root
- Verify no test scripts reference `test/` at the root level (check `package.json` scripts)
- Note: Task 34a/34b may already handle this as part of the test suite split — coordinate accordingly

### 2. Delete Root `src/` Directory
- `rm -rf src/` from the repository root
- Verify the build pipeline still works: `npm run clips` should output to `akvj/src/public/clips/`
- Verify `npm run build` still works

### 3. Verify
- Run `npm run lint` to ensure no broken references
- Run `npm run test` to ensure tests still pass
- Run `npm run build` to ensure build still works
- Confirm `akvj/src/public/clips/` still has all clips

## Key Files
- `test/` — root test directory to delete
- `src/` — root src directory to delete
- `mainframe/scripts/clips/index.js` — confirms build pipeline uses `akvj/src/public/clips/`
- `package.json` — check for any root `test/` references in scripts

## Constraints
- Do NOT delete `akvj/src/` or `akvj/test/` — only the ROOT-level directories
- Ensure build pipeline still works after deletion
- Run `npm run lint && npm run test` before reporting

## Dependencies
- Should be done after Task 34a and 34b (test suite split) to avoid conflicts
