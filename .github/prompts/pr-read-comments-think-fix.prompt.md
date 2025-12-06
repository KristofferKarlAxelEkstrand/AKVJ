PR Read / Comments -> Think, Fix, Respond (MCP-enabled)

Purpose

- This prompt guides a PR reviewer using the repository's MCP to: fetch all PR context, evaluate each comment, decide what to implement, apply and test changes, and reply to PR comments concisely.

Constraints & Principles

- Be short, concise, and down-to-earth.
- Prioritize safety, correctness, readability, and maintainability.
- Favor minimal, well-scoped changes and small commits.
- Always run lint, tests, and the build (plus any repo-specific validations) after edits.
- Do not push to main. Push only to the PR branch or a dedicated patch branch.

Procedure (for each PR)

1. Fetch PR context (MCP): title, description, author, changed files, statuses, commits, review comments, and any CI results.
2. Gather all review comments / review threads. List them grouped by file.
3. For each comment, decide and record a concise decision:
    - Accept (apply a fix): explain why this improves code quality/readability/security/perf.
    - Modify (partial accept): explain what will be done and why some variance is chosen.
    - Decline (won't fix): provide a short reason (compatibility, UX, no-op, duplication, risky), and propose alternative if needed.
4. Prioritize fixes by risk and value. Prefer addressing blocking issues first (security, correctness, tests), then style and minor improvements.

Implementation Guidelines

- Make code changes in small, focused commits with clear messages (e.g., "fix(animations): update generator to only include png when present").
- Run these checks locally after each change or batch:
    - npm run lint
    - npm run test
    - npm run build
    - If animation assets or pipeline changes: npm run animations (optionally --validate-only)
- If a suggested change is invasive (high risk), open a follow-up PR or ask for clarification rather than making a risky change without approval.
- Where a comment suggests adding a new feature (e.g., CI check), prefer small, isolated additions and include tests if applicable.

Applying fixes (details)

- For each accepted change:
    - Implement the change, run the checks, and locally confirm no regressions.
    - Commit with a short message and push to the PR branch or a new branch (e.g., pr-<num>-patch) if you can't push to the PR branch.
    - Update the PR comment: "Done — fixed in <commit-sha>" and include a 1-line justification where appropriate.
- For each decline or partial accept:
    - Reply explaining tradeoffs and chosen approach.
    - If helpful, provide a short code snippet or alternative plan.
    - If clarification is required, add a short comment and do not act until clarified.

Resolving review threads

- Close the conversation only when the issue is fixed, sufficiently explained, or unreachable (documented rationale).
- When resolving: append a short PR comment that references the commit(s) and briefly summarises the fix or rationale.

Post-check & Copilot step

- After all changes and replies have been made and validations pass, request a code review by Copilot (and optionally other reviewers):
    - Post a final PR comment summarizing what was done and tagging @copilot (or the Copilot reviewer bot) asking for a final automated review.
    - If you have repository permissions, also request a GitHub review from Copilot via the MCP.

Examples (short, focused language):

- "Done — replaced `fs.rmdir` with `fs.rm` (compatibility). Local lint/test/build OK. Commit: abc123."
- "Decline — changing API signature here would break existing callers. Alternative: deprecate and follow-up PR."
- "Partial — improved validation logic; left performance optimization for later if needed. Commit: def456."

Notes

- Keep all code changes under the repo style and architecture constraints (vanilla JS, no frameworks, use event-based `AppState`, private fields where appropriate, etc.).
- Be conservative about adding 3rd-party dependencies (e.g., `sharp`): only add if CI/workflow supports native modules and the benefit outweighs maintenance complexity.
- When in doubt, open a short discussion in the PR instead of guessing.

Acceptable outputs for the MCP agent

- A list of decisions per comment (Accept / Partial / Decline) with short justification.
- A list of commits/patches applied and confirmation of CI checks passing.
- PR replies posted for each fixed/resolved comment, and new PR comment summarizing all work.

Tone: Keep it short and confident. Answer precisely and justify briefly if you decide not to apply a suggestion.
