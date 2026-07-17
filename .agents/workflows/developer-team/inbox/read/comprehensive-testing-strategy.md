# Implementation Guide: Comprehensive Testing Strategy

**Goal:**
We need to ensure absolute stability so that the servers (`akvj` and `mainframe`) never hang on startup again, and that frontend UI functionality does not regress. The current testing setup covers unit tests and some visual regression, but lacks end-to-end (E2E) verification and startup smoke tests.

Please execute the following comprehensive testing plan:

## 1. Server Startup Smoke Tests
The most critical failure mode right now is servers spinning infinitely and not booting. We need tests that verify the actual processes can start.
- **Implementation**: Create a script (e.g., `tests/smoke/startup.test.js`) that uses Node's `child_process.spawn` to run `npm run akvj` and `npm run mainframe`.
- **Validation**: Use a polling mechanism to fetch the local URLs (e.g., `http://localhost:5173/` and `http://localhost:5174/api/health`).
- **Failure Condition**: If the servers do not return an HTTP 200 within 10 seconds, the test fails, and the child processes are forcefully killed. 

## 2. Real Frontend E2E Tests with Playwright
We need real browser tests that click through the UI to ensure the DOM behaves as expected.
- **Setup**: Install `@playwright/test` at the monorepo root.
- **Mainframe Tests**: 
  - Navigate to the dashboard.
  - Verify that the clip catalog loads and renders properly on screen.
  - Test the "Edit Metadata" workflow by interacting with the forms and verifying the API saves the data.
  - Assert that zero unhandled JavaScript exceptions or console errors occur during navigation.
- **AKVJ Tests**:
  - Load the visualizer URL.
  - Assert the `<adventure-kid-video-jockey>` custom element and canvas mount successfully.
  - Ensure the render loop starts without throwing errors.

## 3. Expand Visual Regression
- `akvj` already utilizes `@vitest/browser-playwright` for canvas pixel matching.
- **Action**: Extend this to `mainframe`. Take full-page snapshots of the Library and Mapping tabs to catch CSS regressions or broken layouts in the backoffice.

## 4. CI/CD Enforcement
- Integrate these new smoke and E2E tests into the standard `npm run test:all` pipeline or a dedicated `test:e2e` script.
- They must run on every commit to ensure we never merge code that breaks the boot sequence.
