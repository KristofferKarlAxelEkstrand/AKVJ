# Research: Overall Code Quality & Testing Tools

**Context:**
I've reviewed the current repository tooling. The project already has a solid foundation with ESLint, Prettier, Stylelint, Vitest (including Playwright for visual tests), Husky, and lint-staged. 

However, there are a few industry-standard tools and practices missing that would perfectly complement the "Vanilla JS, high performance" architecture of this project without adding unnecessary bloat.

### Action Plan for the Server Architect:
Please review the following tools and integrate them into our pipeline where appropriate:

## 1. Unused Code & Dependency Detection: `Knip`
As the project refactors (like moving to Custom Elements or decoupling the mainframe), dead code and unused exports accumulate. 
- **Tool**: [Knip](https://knip.dev/)
- **Why**: It automatically scans the entire monorepo for unused files, unused exports, and unused dependencies in `package.json`. It's incredibly fast and perfect for keeping a lightweight project lean.
- **Action**: Install `knip`, add a `knip.json` config for the workspaces, and add a `npm run knip` script to CI.

## 2. Static Type Checking (Without TypeScript): `tsc --checkJs`
The project enforces Vanilla JS, which is great, but we lose the safety of static typing.
- **Tool**: TypeScript (Compiler only)
- **Why**: You can use `tsc` to type-check standard Javascript files via JSDoc comments by setting `"allowJs": true` and `"checkJs": true` in a `jsconfig.json`. This gives you all the autocomplete and error-catching of TypeScript without *actually* using TypeScript or requiring a build step.
- **Action**: Add a `jsconfig.json` at the root and a `npm run typecheck` script that runs `tsc --noEmit`.

## 3. Test Coverage Enforcement: `@vitest/coverage-v8`
We have over 1800 Vitest tests, but no strict coverage threshold.
- **Tool**: Vitest V8 Coverage
- **Why**: We need to ensure that as new features are added, test coverage doesn't drop. 
- **Action**: Install `@vitest/coverage-v8`, update the `vitest.config.js` files to include coverage thresholds (e.g., 80% lines/branches), and run `vitest run --coverage` in CI.

## 4. Performance Guarding: Lighthouse CI (`@lhci/cli`)
The `akvj` visualizer has a strict requirement of locking at 60fps and keeping the main thread clear.
- **Tool**: Lighthouse CI
- **Why**: It can run automatically against the built `akvj` production bundle in headless Chrome and fail the build if the "Performance" score drops below 100 or if main-thread blocking time exceeds a threshold.
- **Action**: Add a `.lighthouserc.json` and a CI step to run it against the preview server.

## 5. Commit Convention Enforcement: `commitlint`
We already use Husky for pre-commit linting.
- **Tool**: `@commitlint/cli` and `@commitlint/config-conventional`
- **Why**: Enforces clean, readable git histories (e.g., `feat(mainframe): add piano`, `fix(akvj): resolve canvas leak`).
- **Action**: Add a `commit-msg` Husky hook to run commitlint.
