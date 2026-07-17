# Team Guidelines: Architecture Direction

## Custom HTML Elements & Event-Based Communication

All developers should follow these principles for ongoing and future work:

- **Prefer custom HTML elements** where appropriate for UI components
- **Use event-based communication** instead of tightly coupled direct calls where possible
- **Keep refactors small and focused** on improving structure without changing behavior unexpectedly
- **Incremental improvement** — not large rewrites. Small steps toward a more maintainable foundation.

## Manual Code Quality (Post-Husky)

With husky removed, developers must manually verify before reporting tasks complete:
- Run `npm run lint` to catch syntax/formatting errors
- Run `npm run test` to catch test failures
- Be rigorous about self-verification

## QA Encouragement

- Proactively ask for QA review on work going forward
- Quality Assurance improves overall code quality and helps catch bugs early
- When completing a task, consider if peer review or additional testing would add confidence

## Slack General Hygiene

`slack/general/` is for shared artifacts only: the team dashboard, team guidelines, and active `[LOCK]` files. It is **not** an archive for old messages. Delete processed `[TASK]`, `[REPORT]`, `[FEEDBACK]`, `[APPROVED]`, and `[REJECTED]` files directly — do not move them to `slack/general/`. If old message files have accumulated there, the Team Lead should clean them up during the next dashboard update.
