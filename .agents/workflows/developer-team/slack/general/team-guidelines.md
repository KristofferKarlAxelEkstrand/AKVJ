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

## Avoid Over-Engineering

When planning or implementing new features, evaluate if the proposed solution is unnecessarily complex. Favor simpler, maintainable approaches and tech choices that align with our long-term capabilities. Over-engineering leads to technical debt, harder maintenance, and slower progress.

## KISS Principle — Vanilla JS & Web Components

1. **Vanilla JS only**: Do not introduce large frontend frameworks. Stay close to platform standards.
2. **Custom Elements**: Utilize standard Web Components (custom elements) wherever it makes sense for encapsulation and reusability.
3. **KISS (Keep It Simple, Stupid)**: Keep it simple. Build a robust set of features, but implement them simply and elegantly. Always prioritize readable, standard code over complex abstractions.

## CSS Per Custom Element (Almost No Global CSS)

Mainframe styling should be owned by the components that use it, not dumped in one global stylesheet.

1. **Almost no general CSS** — Do not add component look-and-feel to a global stylesheet. No growing dump of shared class rules for UI pieces.
2. **One stylesheet per custom element** — Each custom element owns its styles (SCSS next to / for that component). Scope under that element so it can change independently without surprising other pages.
3. **Use SCSS (Sass)** — Use SCSS for component styles — not as an excuse to build a large global design-system CSS layer.
4. **Custom elements + events** — Prefer custom elements. Talk between them with events. Stay modular and loosely coupled.
5. **Allowed global baseline only** — The intentional global layout model:
   ```css
   html { box-sizing: border-box; }
   *, *:before, *:after { box-sizing: inherit; }
   ```
   Minimal page-shell resets (e.g. `body` margin/font) are OK if truly document-level. **Not** component chrome, tabs, editors, piano keys, lists, etc. — those belong on the custom element.

## Slack General Hygiene

`slack/general/` is for shared artifacts only: the team dashboard, team guidelines, and active `[LOCK]` files. It is **not** an archive for old messages. Delete processed `[TASK]`, `[REPORT]`, `[FEEDBACK]`, `[APPROVED]`, and `[REJECTED]` files directly — do not move them to `slack/general/`. If old message files have accumulated there, the Team Lead should clean them up during the next dashboard update.
