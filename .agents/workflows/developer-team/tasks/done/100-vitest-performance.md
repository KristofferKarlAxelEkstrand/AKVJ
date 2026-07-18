# Task 100: Investigate Vitest Performance and Recommend Optimizations

## Severity: Medium (Developer experience — user requested)

## Location
- `akvj/vitest.config.js`
- `akvj/vitest.visual.config.js`
- `mainframe/vitest.config.js`
- `mainframe/vitest.visual.config.js`
- `package.json` (root test scripts)

## Problem
Vitest runs are taking longer than desired in day-to-day development. User wants to understand where the time goes and whether we can speed things up without weakening coverage.

## Requirements
Investigate and report back with:

1. **What is actually slow**
   - Startup time
   - jsdom suite timing
   - Visual/browser suite timing
   - Workspace fan-out overhead
   - Measure each: `npm run test` (akvj), `npm run test -w mainframe`, `npm run test:visual`

2. **Whether we can speed it up**
   - Parallelism / pool settings (threads vs forks)
   - Splitting suites
   - Caching
   - Skipping redundant work
   - Environment setup optimization

3. **Recommended config or workflow changes**
   - Keep reliability intact
   - Don't weaken coverage
   - Practical improvements only

## Scope
- Read all vitest config files
- Measure test run times for each workspace
- Identify bottlenecks
- Propose concrete config changes
- Implement safe optimizations
- Verify tests still pass after changes

## Verification
- Run `npm run test` to ensure akvj tests pass
- Run `npm run test -w mainframe` to ensure mainframe tests pass
- Run `npm run lint` to ensure no lint errors
- Compare before/after timing

## Key Files
- `akvj/vitest.config.js`
- `akvj/vitest.visual.config.js`
- `mainframe/vitest.config.js`
- `mainframe/vitest.visual.config.js`

## Constraints
- **Don't weaken coverage** — reliability must stay intact
- **KISS** — practical improvements only
- **NPM Protocol**: NEVER run `npm install` yourself. Request via `[NPM-REQUEST]` to Team Lead if needed.

## Dependencies
- None — investigation task
