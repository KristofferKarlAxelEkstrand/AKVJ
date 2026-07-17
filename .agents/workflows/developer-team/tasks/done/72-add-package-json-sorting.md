# Task 72: Add package.json Sorting Tool

## Severity: Low (Code quality)

## Location
- Root `package.json`
- `akvj/package.json`
- `mainframe/package.json`

## Problem
`package.json` files have inconsistent field ordering. A sorting tool would standardize field order and prevent merge conflicts.

## Fix
1. Install `sort-package-json` as a dev dependency (Team Lead will execute npm install)
2. Add a `format:sort-package-json` script to root `package.json`
3. Integrate into the formatting pipeline (e.g., add to `npm run format:prettier`)
4. Run the tool once to sort all package.json files

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test` to ensure all tests pass
- Verify all package.json files are sorted

## Key Files
- `package.json` (root)
- `akvj/package.json`
- `mainframe/package.json`

## NPM Request Required
Developer must submit `[NPM-REQUEST]` for `sort-package-json` dev dependency installation.

## Dependencies
- None
