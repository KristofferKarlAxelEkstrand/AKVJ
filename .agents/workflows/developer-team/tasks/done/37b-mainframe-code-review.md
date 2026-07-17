# Task 37b: Mainframe Proactive Code Review

## Objective
Conduct a deep-dive architectural review of the `mainframe/` tooling/UI codebase. Identify bugs, technical debt, optimization issues, and architectural concerns.

## Review Areas

### 1. Bug Hunting
- Review all modules in `mainframe/src/js/` for potential bugs
- Check server endpoints in `mainframe/server/` for edge cases
- Review clip pipeline scripts in `mainframe/scripts/clips/` for errors
- Look for unhandled error cases in API routes

### 2. Performance
- Are API endpoints efficient? Any unnecessary blocking?
- Are file operations (clip reading/writing) properly async?
- Are there memory leaks in the UI components?

### 3. Architecture
- Are custom HTML elements being used where appropriate?
- Is event-based communication being used instead of direct calls?
- Is the server/frontend boundary clean?
- Are there any tight couplings between modules?

### 4. Code Quality
- Are naming conventions being followed? (descriptive names, no vague terms)
- Are there any dead code paths or unused exports?
- Is error handling consistent across modules?
- Are tests covering critical paths?

## Output
Do NOT fix anything. Instead, write a detailed findings report for each issue found and drop it into `../inbox/` as a new bug/feature request file. The Team Lead will triage and schedule them.

## Key Directories to Review
- `mainframe/src/js/` — frontend UI code
- `mainframe/server/` — backend API server
- `mainframe/scripts/clips/` — clip pipeline (validate, optimize, generate, copy)
- `mainframe/test/` — test coverage

## Constraints
- Do NOT make any code changes — review only
- Write findings as `.md` files in `../inbox/` with clear descriptions
- Categorize each finding as: `[BUG]`, `[TECH-DEBT]`, `[OPTIMIZATION]`, or `[ARCHITECTURE]`

## Dependencies
- None (can be done in parallel with Task 37a)
