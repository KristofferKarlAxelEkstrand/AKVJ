# PR Review & Fix

Review PR comments, decide what to fix, apply changes, and respond.

## Principles

- Short, focused commits with clear messages
- Run `npm run lint && npm run test && npm run build` after changes
- For animation changes, also run `npm run generate-animation-json-to-json`
- Push to PR branch only (never main)
- When unsure, ask instead of guessing
- Never use MCP tools to push changes or update repository files directly; always use a local git workflow (commit, push, PR) or the GitHub web UI/CLI with appropriate user credentials. MCP can fetch PR context and comments but must not be used to modify repo content.

## Workflow

1. **Fetch context**: Use MCP to get PR details, changed files, review comments, and CI status
2. **Decide per comment**:
    - **Accept**: Apply fix, explain briefly why it improves the code
    - **Partial**: Apply modified fix, explain variance
    - **Decline**: Explain why (risk, compat, duplicate) and suggest alternative
3. **Prioritize**: Blocking issues (security, correctness) first, then style
4. **Implement**: Small commits, run checks, push
5. **Respond**: Reply to each comment with decision and commit SHA if fixed

## Reply Format

- Accept: `"Done — <what changed>. Commit: abc123."`
- Partial: `"Partial — <what was done>, <what was skipped and why>. Commit: abc123."`
- Decline: `"Decline — <reason>. Alternative: <suggestion>."`

## Resolving Threads

- Resolve after fixing (with commit SHA) or declining (with rationale)
- Leave open if awaiting clarification or partial fix needs confirmation
- For outdated threads: resolve with brief note on why obsolete

## CI Failures

```bash
gh pr checks <PR_NUMBER>           # Check status
gh run view <RUN_ID> --log         # View logs
npm ci && npm run lint && npm test # Reproduce locally
```

If complex, open a follow-up issue rather than making risky fixes.

## Final Step

After all changes pass validation:

- Request Copilot review: `mcp_io_github_git_request_copilot_review(owner, repo, pullNumber)`
- Confirm CI passes before marking ready for merge

## Repo Constraints

- Vanilla JS only, no frameworks
- Follow existing patterns (event-based AppState, private fields)
- Avoid new dependencies unless clearly justified
