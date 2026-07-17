# Task 27: Code Quality Tools Integration

## Objective
Integrate industry-standard code quality tools to complement the vanilla JS architecture.

## Sub-tasks
1. **Knip** — Install, add `knip.json` config for workspaces, add `npm run knip` script. Scans for unused files, exports, dependencies.
2. **tsc --checkJs** — Add `jsconfig.json` at root with `allowJs` + `checkJs`, add `npm run typecheck` script running `tsc --noEmit`.
3. **@vitest/coverage-v8** — Install, update vitest configs with coverage thresholds (80% lines/branches), add `vitest run --coverage` to CI.
4. **Lighthouse CI** — Add `.lighthouserc.json`, CI step against preview server for akvj performance guarding.
5. **commitlint** — Install `@commitlint/cli` + `@commitlint/config-conventional`, add `commit-msg` Husky hook.

## Dependencies
None
