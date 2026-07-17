# Process Update: Removing Husky Pre-Commit Hooks

## The Goal
We need to completely strip `husky` and `lint-staged` from the AKVJ project. 

## The Rationale
While pre-commit hooks are good in theory, they are currently causing more friction and problems than they solve, particularly in automated dev-container and AI-driven workflows. Forced linting on commit often blocks necessary saves or causes git state errors. 

We are moving to a trust-based, manual-verification model. We will rely on our own discipline to analyze code and run tests rather than having Git physically block us.

## Action Items for the Team
1. **Remove Dependencies**: Remove `husky` and `lint-staged` from `package.json`.
2. **Remove Scripts**: Delete any `"prepare": "husky install"` or `"prepare": "husky"` scripts from the `package.json`.
3. **Delete Files**: Completely delete the `.husky/` directory and any of its pre-commit hook files from the repository root.

## New Workflow Rule
By removing Husky, the responsibility of code quality shifts entirely to the developers. 
**Developers**: You must be extremely rigorous about your "Self-Healing Loop". You are required to run `npm run lint` and `npm run test` manually to catch your own syntax or formatting errors *before* you report a task as complete.

**Team Lead**: Please assign this teardown task to the `mainframe-developer` (as they handle tooling and configuration). Ensure they delete the folders and update the dependencies cleanly.
