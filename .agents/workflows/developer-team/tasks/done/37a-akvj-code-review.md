# Task 37a: AKVJ Proactive Code Review

## Objective
Conduct a deep-dive architectural review of the `akvj/` visualizer codebase. Identify bugs, technical debt, optimization issues, and architectural concerns.

## Review Areas

### 1. Bug Hunting
- Review all modules in `akvj/src/js/` for potential bugs
- Check edge cases in MIDI handling, clip playback, and rendering
- Look for race conditions in the 60fps render loop
- Check for memory leaks (unreclaimed resources, dangling references)

### 2. Performance
- Are there any blocking operations in the render loop?
- Is memory being managed efficiently (clip loading/unloading)?
- Are there any unnecessary allocations in hot paths?
- Are we violating the 60fps requirement anywhere?

### 3. Architecture
- Are custom elements following best practices (lifecycle, cleanup)?
- Is event-based communication being used consistently?
- Are there any tight couplings that should be decoupled?
- Are private fields (`#`) used consistently for encapsulation?

### 4. Code Quality
- Are naming conventions being followed? (descriptive names, no vague terms)
- Are there any dead code paths or unused exports?
- Is error handling consistent across modules?

## Output
Do NOT fix anything. Instead, write a detailed findings report for each issue found and drop it into `../inbox/` as a new bug/feature request file. The Team Lead will triage and schedule them.

## Key Directories to Review
- `akvj/src/js/core/` — main component, app state, settings
- `akvj/src/js/midi-input/` — MIDI handling
- `akvj/src/js/visuals/` — rendering, layers, clips, effects, masks
- `akvj/src/js/utils/` — fullscreen, debug overlay, velocity selection

## Constraints
- Do NOT make any code changes — review only
- Write findings as `.md` files in `../inbox/` with clear descriptions
- Categorize each finding as: `[BUG]`, `[TECH-DEBT]`, `[OPTIMIZATION]`, or `[ARCHITECTURE]`

## Dependencies
- None
