# Team Update: Refactoring toward custom HTML elements and event-based communication

## Summary
We are continuing a small refactoring pass to move the codebase further toward a cleaner architecture based on custom HTML elements and event-driven communication.

## Impact
This work should make the UI and runtime components more modular, easier to reason about, and more consistent with the existing component-oriented structure of the project.

## Action Needed
Please keep the following direction in mind while making changes:
- prefer custom HTML elements where appropriate
- use event-based communication instead of tightly coupled direct calls where possible
- keep refactors small and focused on improving structure without changing behavior unexpectedly

## Notes
The goal is incremental improvement rather than a large rewrite. Small steps in this direction should help us build a more maintainable foundation over time.
