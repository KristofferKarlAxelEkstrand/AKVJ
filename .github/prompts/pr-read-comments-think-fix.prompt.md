# PR Review & Fix

Review PR comments, decide what to fix, apply changes, and respond.

## Principles

- Short, focused commits with clear messages
- Run `npm run lint && npm run test && npm run build` after changes
- For animation changes, also run `npm run generate-animation-json-to-json`
- Push to PR branch only (never main)
- When unsure, ask instead of guessing
- MCP tooling can sometimes update PR content, but to avoid unexpected credential issues and maintain clear authoring and traceability, prefer a local git workflow (commit, push, PR) or the GitHub web UI/CLI for making code changes. Do not rely on MCP tools to push changes from the workspace; they should be used primarily for reading PR context, comments, and statuses.
- DO NOT create a separate or follow-up PR to address the comments on this PR unless there's a strong, documented reason — focus on this PR. The goal is to address or discard all review comments here so the end result is a single, well-reviewed PR with excellent code.

## Workflow

1. **Fetch context**: Use MCP to get PR details, changed files, review comments, and CI status
2. **Categorize all comments first**: Before implementing anything, read through all comments and sort them into categories (accept, partial, decline, already-resolved). This prevents context-switching and helps batch related fixes.
3. **Decide per comment**:
    - **Accept**: Apply fix, explain briefly why it improves the code
    - **Partial**: Apply modified fix, explain variance
    - **Decline**: Explain why (risk, compat, duplicate) and suggest alternative
    - **Already resolved**: Prior commits in the PR already addressed this — note the commit SHA and resolve
    - **Avoid creating a new PR for these changes**: Prefer updating the existing branch/PR to keep review history and the conversation focused. If a change is truly large or out of scope, document the rationale and open a follow-up issue or PR and link it from this PR.
4. **Prioritize**: Blocking issues (security, correctness) first, then style
5. **Implement**: Small commits, run checks, push
6. **Respond**: Reply to each comment with decision and commit SHA if fixed

## Reply Format

- Accept: `"Done — <what changed>. Commit: abc123."`
- Partial: `"Partial — <what was done>, <what was skipped and why>. Commit: abc123."`
- Decline: `"Decline — <reason>. Alternative: <suggestion>."`
- Already resolved: `"Already addressed in commit abc123 — <brief note>."`

## Resolving Threads

- Resolving conversations is a good thing — resolve threads when possible: either the change is implemented or the comment is not a valid/important issue.
- Resolve after fixing (with commit SHA) or declining (with rationale)
- Leave open if awaiting clarification or partial fix needs confirmation
- For outdated threads: resolve with brief note on why obsolete

### How to Resolve Conversations (Practical Guidance)

Resolving threads should be intentional — it signals that the issue is handled or doesn't need further action. Follow these guidelines when deciding to resolve a review thread:

- Resolved because change is implemented: If you've implemented the requested change or applied an alternate fix, resolve the thread and include the commit SHA or a short explanation and the commit message. Example:
    - "Done — Applied change and added tests. Commit: b6fb1e3"

- Resolved because the comment is outdated: If rebase/HMR/refactor or another change made the comment irrelevant, resolve the thread and explain why it's no longer applicable. Example:
    - "Resolve — Outdated after refactor in commit b6fb1e3; the change moved into `LayerManager`"

- Resolved because a prior commit already addressed it: Many review comments get addressed by earlier commits in the same PR before you review them. Check the current code state — if it already implements the suggestion, resolve with the commit SHA. Example:
    - "Already addressed in commit b6fb1e3 — null guard added as suggested"

- Resolved because it will not be worked on: If the suggestion is valuable but out of scope or a deliberate design decision was made, resolve the thread and explain the decision and next steps (open issue or follow-up PR if necessary):
    - "Decline — Out-of-scope for this PR; opening a follow-up issue to track the improvement"

- Resolved because it's not worth doing: If a comment suggests a micro-optimization or stylistic preference that doesn't deliver value and the change would harm readability or cause churn, explain the reasoning and resolve. Example:
    - "Decline — Not worth the change; current behavior preserves clarity and keeps API stable"

- Resolved because the issue is outside repo ownership: If a thread asks for a large or risky change (e.g. migrating frameworks), explain constraints and suggest a follow-up issue or alternative. Example:
    - "Decline — Large migration; suggest opening an issue to discuss approach"

Best practices when resolving threads:

- Be concise and specific: State the reason and cite commits (SHA) for implemented changes.
- Don't resolve others' threads unilaterally: If you close a reviewer's thread, ensure you explain why and involve them if it's not obvious.
- Use the GitHub UI to mark threads as resolved, or use the GraphQL `resolveReviewThread` mutation (if you do this programmatically make sure you're the author of the fix or authorized). Avoid programmatic resolving without a visible reason in the thread.
- When you close with "Won't fix" or "Decline", prefer to reference an open issue or give a clear reason to avoid confusion.

If in doubt, leave a small follow-up message asking for clarification. When a reviewer replies that they're OK, resolve the thread and continue.

### How to Resolve a Thread via GraphQL

MCP does not currently support resolving PR review threads directly. Use the GitHub GraphQL API with `gh api graphql`.

#### Quick Reference

```bash
# Resolve a single thread
gh api graphql -f query='mutation { resolveReviewThread(input: { threadId: "PRRT_xxx" }) { thread { isResolved } } }'

# Unresolve a thread
gh api graphql -f query='mutation { unresolveReviewThread(input: { threadId: "PRRT_xxx" }) { thread { isResolved } } }'
```

#### 0. Resolve all outdated threads first (recommended)

Start by clearing outdated threads to focus on active issues:

```bash
# Get IDs of outdated unresolved threads
OUTDATED=$(gh api graphql -f query='
  query {
    repository(owner: "OWNER", name: "REPO") {
      pullRequest(number: PR_NUMBER) {
        reviewThreads(first: 100) {
          nodes { id isResolved isOutdated }
        }
      }
    }
  }
' | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false and .isOutdated == true) | .id')

# Resolve each outdated thread
for THREAD_ID in $OUTDATED; do
  echo "Resolving outdated: $THREAD_ID"
  gh api graphql -f query="mutation { resolveReviewThread(input: { threadId: \"$THREAD_ID\" }) { thread { isResolved } } }" --silent
done
```

#### 1. List unresolved threads for a PR

```bash
gh api graphql -f query='
  query {
    repository(owner: "OWNER", name: "REPO") {
      pullRequest(number: PR_NUMBER) {
        reviewThreads(first: 100) {
          nodes {
            id
            isResolved
            comments(first: 1) {
              nodes {
                body
              }
            }
          }
        }
      }
    }
  }
'
```

Filter to unresolved only with `jq`:

```bash
gh api graphql -f query='...' | jq '[.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false)]'
```

#### 2. Resolve a single thread

```bash
gh api graphql -f query='
  mutation {
    resolveReviewThread(input: { threadId: "PRRT_kwDOA2KbxM5XXXXXXX" }) {
      thread {
        isResolved
      }
    }
  }
'
```

The response confirms success:

```json
{
    "data": {
        "resolveReviewThread": {
            "thread": {
                "isResolved": true
            }
        }
    }
}
```

#### 3. Resolve multiple threads in a loop

```bash
# Get all unresolved thread IDs
THREAD_IDS=$(gh api graphql -f query='
  query {
    repository(owner: "OWNER", name: "REPO") {
      pullRequest(number: PR_NUMBER) {
        reviewThreads(first: 100) {
          nodes { id isResolved }
        }
      }
    }
  }
' | jq -r '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved == false) | .id')

# Resolve each thread
for THREAD_ID in $THREAD_IDS; do
  echo "Resolving $THREAD_ID..."
  gh api graphql -f query="mutation { resolveReviewThread(input: { threadId: \"$THREAD_ID\" }) { thread { isResolved } } }"
done
```

#### 4. Unresolve a thread (if needed)

```bash
gh api graphql -f query='
  mutation {
    unresolveReviewThread(input: { threadId: "PRRT_kwDOA2KbxM5XXXXXXX" }) {
      thread {
        isResolved
      }
    }
  }
'
```

**Important**: Always leave a comment explaining why you're resolving the thread before resolving it programmatically. This maintains transparency in the review conversation.

## CI Failures

```bash
gh pr checks <PR_NUMBER>           # Check status
gh run view <RUN_ID> --log         # View logs
npm ci && npm run lint && npm test # Reproduce locally
```

If complex, open a follow-up issue rather than making risky fixes.

## Final Step

After all changes pass validation:

- Push your updated branch to the PR remote so CI and reviewers can verify the changes:
    ```bash
    git push origin YOUR_BRANCH
    ```
- Request Copilot review via MCP using the tool `mcp_io_github_git_request_copilot_review(owner, repo, pullNumber)`
    - Example pseudo-call (adapt to your MCP tool):
        ```js
        mcp_io_github_git_request_copilot_review({ owner: 'KristofferKarlAxelEkstrand', repo: 'AKVJ', pullNumber: 34 });
        ```
- Confirm CI passes before marking ready for merge

## Troubleshooting git push

- If you see errors when pushing (403, 302 redirects, or authentication failures) while working in a workspace or CI, it's often caused by an existing GITHUB_TOKEN or other token in the environment that takes precedence over your personal credentials. You can resolve this by unsetting the token for the session and pushing again using your usual credentials:

```bash
# Unset the token for this terminal session
unset GITHUB_TOKEN

# Verify your remote is correct, and push (or use `gh auth login` to reauthenticate)
git remote -v
git push origin YOUR_BRANCH
```

- Alternative: switch to an SSH remote and push using your SSH key:

```bash
git remote set-url origin git@github.com:OWNER/REPO.git
git push origin YOUR_BRANCH
```

- If a re-push still fails, log in with `gh auth login` or open a PR in the GitHub web interface. If you must use a token, prefer a PAT set as a local credential rather than the environment GITHUB_TOKEN set by a CI or workspace process.

## Repo Constraints

- Vanilla JS only, no frameworks
- Follow existing patterns (event-based AppState, private fields)
- Avoid new dependencies unless clearly justified
