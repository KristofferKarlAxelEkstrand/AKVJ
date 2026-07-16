# Routine Maintenance Fallbacks

If the `inbox/` is empty and the `tasks/` queue is completely cleared, do not just exit. Instead, pick ONE of the following routine maintenance tasks to execute to ensure the codebase remains healthy over time.

### 1. Test Audit & Coverage
- Run `npm run test:all`. If anything fails, fix it.
- If everything passes, pick a critical file in `akvj/src/` or `mainframe/server/` that lacks comprehensive tests and write a new test suite for it in the `test/` directory.

### 2. Dependency Audit
- Check the `package.json` files across the workspaces.
- Look for outdated minor or patch versions of dependencies.
- Update them, run `npm install`, and ensure the build and tests still pass.

### 3. Linting & Formatting Sweep
- Run `npm run lint` and `npm run format:check`.
- Auto-fix any styling issues and manually resolve any deeper architectural linting warnings.

### 4. Cognitive Refactoring
- Pick a module that has grown complex and apply cognitive refactoring.
- Extract long methods into smaller, focused helpers.
- Rename generic variables to be highly descriptive following our `code-standards.md`.
- Ensure all public methods have standard JSDoc comments.
