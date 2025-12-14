# Deep Code Analysis

Perform a thorough, multi-pass analysis of this entire project. Take your time with each pass - quality matters more than speed. Read every file, understand every connection.

---

## Pass 1: Complete Read-Through

Read the entire codebase systematically:

1. **Configuration & Entry**
    - `package.json` - dependencies, scripts, project structure
    - `vite.config.js`, `eslint.config.js`, `vitest.config.js`
    - Entry points: `src/main.js`, `src/index.html`

2. **Core Application**
    - All files in `src/js/core/`
    - All files in `src/js/visuals/`
    - All files in `src/js/midi-input/`
    - All files in `src/js/utils/`

3. **Build Scripts**
    - All files in `scripts/`

4. **Tests**
    - All files in `test/`

5. **Documentation**
    - README, AGENTS.md, docs/

**Build a complete mental model:** How does data flow? How do components connect? What is the lifecycle?

---

## Pass 2: Inconsistencies & Obvious Issues

Scan for things that don't match or contradict:

**Naming & Style**

- Inconsistent naming (camelCase vs snake_case, singular vs plural)
- Different patterns between similar files
- Comments that don't match the code
- JSDoc that's outdated or wrong

**Dead Code**

- Unused imports
- Unreachable code paths
- Functions that are never called
- Variables assigned but never read

**Copy-Paste Errors**

- Duplicated code with subtle differences
- Comments copied from elsewhere that don't apply

**Broken References**

- Imports of files/functions that don't exist
- String references to paths that are wrong
- Config values that don't match actual structure

---

## Pass 3: Code Quality Deep Dive

Analyze each file for quality improvements:

**Complexity**

- Functions longer than 40 lines
- Nesting deeper than 3 levels
- Cyclomatic complexity too high
- Single function doing multiple things

**Duplication**

- Same logic repeated in multiple places
- Similar functions that could be unified
- Repeated patterns that need abstraction

**Clarity**

- Magic numbers without constants
- Boolean parameters (what does `true` mean?)
- Variable names that don't explain intent
- Complex expressions without explanation

**Architecture**

- Tight coupling between modules
- Missing abstraction where needed
- Over-abstraction where simple is better
- Circular dependencies

**Performance**

- Work done in hot paths (render loop, event handlers)
- Unnecessary allocations
- Repeated calculations that could be cached
- Memory leaks (listeners not removed)

---

## Pass 4: Bug Hunt

Specifically hunt for bugs:

**Edge Cases**

- Empty array/object
- null / undefined
- Zero, negative numbers
- Single item, first item, last item
- Very large values

**Async Issues**

- Missing `await`
- Unhandled promise rejections
- Race conditions
- Callbacks vs promises mixing

**State Bugs**

- Mutations when copy was intended
- Stale closures
- State not cleaned up properly
- Order-dependent initialization

**Browser/Runtime**

- APIs that might not exist
- Type coercion issues (`==` vs `===`)
- Object reference vs copy confusion
- This binding problems

**Rapid-Fire Testing**

- What if this function is called twice rapidly?
- What if the user clicks while loading?
- What if cleanup runs before setup completes?

---

## Pass 5: Final Comprehensive Check

Review everything together:

**Holistic View**

- Does the architecture make sense?
- Are there hidden assumptions that could break?
- Would a new developer understand this code?
- Is complexity justified?

**Test Coverage**

- Are critical paths tested?
- Are edge cases covered?
- Do tests actually test what they claim?

**Build & Deploy**

- Is the build process reliable?
- Are all necessary files included?
- Is configuration correct?

**Documentation**

- Is documentation accurate?
- Are examples correct and working?
- Are important decisions documented?

**Security**

- User input handling
- Data sanitization
- Exposed internals

---

## Output Format

### 🔴 Critical Issues (Must Fix)

Bugs that will cause problems or break functionality.

```
**File:** path/to/file.js#L42-L45
**Issue:** Description of what's wrong
**Impact:** What breaks because of this
**Fix:** Specific fix to apply
```

### 🟡 Quality Improvements (Should Fix)

Code quality issues that affect maintainability.

```
**File:** path/to/file.js#L100
**Issue:** What could be better
**Improvement:** Suggested change
**Why:** Impact on codebase quality
```

### 🟢 Minor Issues (Nice to Fix)

Small improvements, style issues, minor cleanup.

```
**File:** path/to/file.js
**Issue:** Brief description
**Suggestion:** How to improve
```

### 📋 Out of Scope / Future Ideas

Good ideas that are beyond current scope:

- Larger refactoring opportunities
- New features that would help
- Architectural improvements
- Tooling suggestions

### ✅ What's Done Well

Patterns and practices to preserve:

- Good abstractions
- Clean implementations
- Smart design decisions

---

## Guidelines

- **Be specific:** Include file paths and line numbers
- **Be actionable:** Provide concrete fixes, not vague suggestions
- **Be prioritized:** Bugs > Quality > Style
- **Be simple:** Keep fixes minimal and focused
- **Be sure:** Investigate before reporting - no false positives
- **Be respectful:** Work within existing architecture
- **Be thorough:** Real issues only, but find all of them
