# AKVJ AI Agent Prompt System

This directory contains the core intelligence, workflows, and strict rules for all AI agents contributing to the AKVJ codebase.

## Active Workflows

To trigger any of these systems, copy the provided trigger text and paste it directly into your AI chat window.

### Master Orchestrator (The Master Prompt)
Execute a complete, robust codebase overhaul.
**Trigger:**
> `Read the latest .agents/prompts/master-workflow.prompt.md from disk and execute its workflow.`

### Force Rule Reload
If you updated the rules and want the AI to instantly apply them instead of using its old memory.
**Trigger:**
> `Forget your cached context. Read the latest .agents/prompts/code-of-conduct.prompt.md and .agents/prompts/_memory.md from disk right now, and apply the rules strictly to our current task.`

### Simplify & Flatten
Runs cognitive refactors to extract complexity and make code easier to read.
**Trigger:**
> `Read the latest .agents/prompts/simplify-and-make-easy-to-understand.prompt.md from disk and execute its workflow.`

### Domain Consistency
Enforces strict VJ terminology and naming conventions.
**Trigger:**
> `Read the latest .agents/prompts/naming-standards-and-consistency.prompt.md from disk and execute its workflow.`

### Cruft Elimination
Strips out all dead code, unused dependencies, and orphaned logic.
**Trigger:**
> `Read the latest .agents/prompts/clean-up.prompt.md from disk and execute its workflow.`

### Validation & Pipeline
Ensures the project formatting is flawless and all tests pass with zero errors.
**Trigger:**
> `Read the latest .agents/prompts/lint-test-and-fix.prompt.md from disk and execute its workflow.`

### Test Audit
Massive coverage generator and bug fixer based on known testing gaps.
**Trigger:**
> `Read the latest .agents/prompts/test-audit.prompt.md from disk and execute its workflow.`

### Enforce UTF-8
Fixes encoding issues across the codebase.
**Trigger:**
> `Read the latest .agents/prompts/enforce-utf8.prompt.md from disk and execute its workflow.`

### Resume Work
If the AI stopped before finishing a long task.
**Trigger:**
> `Read the latest .agents/prompts/continue.prompt.md from disk and execute its workflow.`

---

## Core Rules (Passive)
These files contain the fundamental architectural laws of the repository. You do not run these directly; the AI reads them automatically.
- **`code-of-conduct.prompt.md`**: The master ruleset (Vanilla JS, 60fps, Strict Encapsulation).
- **`_memory.md`**: The active memory bank containing current architectural goals, known bugs, and contextual targets.

## Archive
One-off, highly specific migration prompts (such as massive renaming operations) are stored in the `archive/` directory for historical reference.

### Refactor Animations to Clips
> `Read the latest .agents/prompts/archive/refactor-animations-to-clips.prompt.md from disk and execute its workflow.`
