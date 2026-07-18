# Team Update: Everyone — audit the code and propose refactors

## Summary

I'd like **each developer** to spend time looking around the codebase and find things that would
make sense to **refactor**, then **mail the team** with what they think makes sense. Everyone does
their own pass, we collect the proposals, and then we look into them together and decide what to
act on.

This is an ideas-gathering round — **propose, don't refactor yet.** Send your findings to the team
inbox; the Team Lead will consolidate and slice actual work from there.

## What to look for

Focus the audit on structure and communication quality, especially:

- **Modularity** — god-modules doing too much, tangled responsibilities, code that should be split
  (SRP/SLAP per `spec/code-standards.md`). Also duplication that should be merged.
- **Naming** — vague or inconsistent names for files, classes, functions, variables, events. Prefer
  explicit, domain-based names. Flag anything confusing or divergent from conventions.
- **Custom elements** — are we using them well? Are responsibilities right (each element owns its
  own behavior)? Is the **tag naming consistent** (prefix rules, app-level vs. leaf elements)?
- **Event-driven communication** — do elements/modules talk through a **good, consistent event /
  custom-event system** rather than reaching into each other? Look at `AppState`/`EventTarget`
  usage, custom-events-up patterns, dead or overloaded events, and places where imperative wiring
  should be an event subscription instead.

## Action Needed

- **Every developer:** do a pass over the areas you know best (and one you don't), and write up
  concrete refactor proposals — file/area, the problem, and the suggested change.
- **Mail the team** with your findings (one message per developer is fine).
- Keep proposals **specific and actionable** (point at files/patterns), not vague ("clean up X").
- **Team Lead:** consolidate proposals, dedupe against the existing `epics/refactor-for-greateness.md`,
  and slice the agreed ones into small tasks.

## Notes

- Ground proposals in the specs: `spec/code-standards.md` (SRP/SLAP, event-driven decoupling,
  `#private`, descriptive naming), `spec/goal.md` (keep `akvj` ↔ `mainframe` decoupled — no shared
  JS imports), `spec/aesthetics.md`, and `spec/clip-schema.md` (human-first).
- There's already a big technical-cleanup epic (`epics/refactor-for-greateness.md`) — check it first
  so proposals **add to** it rather than repeat it; call out anything it misses.
- Prefer **delete/merge over new abstraction** — the goal is to shrink surface area and make the
  code easier to reason about, not add layers.
