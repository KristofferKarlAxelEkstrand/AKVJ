# Task 33: Remove Husky & lint-staged

## Objective
Completely strip `husky` and `lint-staged` from the AKVJ project. Move to a trust-based, manual-verification model.

## Sub-tasks

### 1. Remove Dependencies
- Remove `husky` and `lint-staged` from `package.json` `devDependencies`
- Remove the `lint-staged` configuration block from `package.json`
- Run `npm install` to update `package-lock.json`

### 2. Remove Scripts
- Delete the `"prepare": "husky"` script from `package.json`

### 3. Delete Files
- Completely delete the `.husky/` directory from the repository root
- Remove any related husky configuration

### 4. Verify
- Run `npm run lint` to ensure linting still works manually
- Run `npm run test` to ensure tests still work manually
- Verify `git commit` works without hooks blocking

## Key Files
- `package.json` — root package.json with husky/lint-staged deps and config
- `.husky/` — directory to delete
- `commitlint.config.js` — check if this should stay (commitlint is separate from husky)

## Constraints
- Do NOT remove `commitlint` — only `husky` and `lint-staged`
- Ensure `npm install` still works cleanly after removal
- New workflow rule: developers must manually run `npm run lint` and `npm run test` before reporting tasks complete

## Dependencies
- None
