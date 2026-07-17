# Task 26: Comprehensive Testing Strategy

## Objective
Implement E2E and smoke tests to prevent startup hangs and UI regressions.

## Sub-tasks
1. **Server startup smoke tests**: `child_process.spawn` to run `npm run akvj` and `npm run mainframe`, poll URLs for HTTP 200 within 10s
2. **Playwright E2E tests**: Install `@playwright/test`, test mainframe UI (clip catalog, edit metadata, no console errors) and akvj (custom element + canvas mount, render loop)
3. **Visual regression for mainframe**: Extend `@vitest/browser-playwright` to mainframe (Library and Mapping tab snapshots)
4. **CI/CD integration**: Add to `test:all` or dedicated `test:e2e` script

## Dependencies
- Task 25 (servers must start first)
