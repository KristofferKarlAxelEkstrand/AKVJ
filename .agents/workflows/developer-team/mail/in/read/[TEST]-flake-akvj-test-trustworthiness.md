# [TEST] Flake hunt: low-trust assertions in akvj tests

Area: `akvj/test/` — test trustworthiness sweep

Sweep date: 2026-07-19

## Findings

### 1. `ProjectCatalog.test.js` cache-busting test is environment-conditional

**File:** `akvj/test/ProjectCatalog.test.js:119-132`

Test name: `appends ?t= cache buster when DEV is true`

Current code:
```js
if (import.meta.env.DEV) {
    expect(url).toMatch(/\?t=\d/);
} else {
    expect(url).toBe(settings.performance.activeProjectUrl);
}
```

`import.meta.env.DEV` is a build-time constant. In a single test run only one branch executes, so the production (non-DEV) cache-buster-off path in `ProjectCatalog.#loadJson` is never exercised. This is a conditional test where the unexecuted branch passes silently.

**Action:** Split into two explicit tests and control the environment with `vi.stubEnv('DEV', true/false)` (or `import.meta.env.DEV` mocking) so both the `?t=` and no-cache-buster URL paths are verified.

### 2. `Clip.test.js` shuffle reset and single-frame tests only assert `not.toThrow()`

**File:** `akvj/test/Clip.test.js:650-659` and `661-679`

Test names:
- `handles a single-frame clip without throwing`
- `resetting the clip clears the unplayed shuffle pool`

Both tests wrap a sequence of `renderToContext` / `reset` calls in `expect(() => { ... }).not.toThrow()` but never check the outcome. The second test is intended to prove that resetting clears the shuffle pool, yet it does not verify that the next cycle again plays every frame exactly once.

**Action:**
- For `single-frame clip`: assert `ctx.drawImage` is called and `clip.currentFrame` remains `0` across multiple renders.
- For `resetting the clip clears the unplayed shuffle pool`: track the frames drawn before reset, call `clip.reset()`, then render `frames` more times and assert the post-reset sequence contains every frame exactly once (or at least that the pool was reshuffled and did not resume the old partial order).

## Tier

Unit (`akvj/test/`). No source changes needed.
