# Task 38a: AKVJ Naming Conventions Audit

## Objective
Audit the `akvj/` visualizer codebase for naming conventions and consistency. Compile findings and proposed schemas without making changes.

## Review Criteria

### 1. Variable Names
- Are there any overly terse or confusing variable names?
- Are all names descriptive and domain-oriented? (e.g., `layerGroup` not `data`)
- Are magic numbers extracted to named constants?

### 2. Class & Function Names
- Do class names accurately describe what they do?
- Are function names clear about their purpose?
- Are private methods prefixed with `#`?

### 3. File Names
- Are PascalCase files only used for class-exporting modules?
- Are lowercase/camelCase files used for all other modules?

### 4. Cross-Project Consistency
- Are naming patterns in `akvj` consistent with those in `mainframe`?
- Are there contradictions in naming schemas between the two projects?

## Output
Do NOT make any code changes. Compile a list of findings and proposed naming schemas into a markdown file and drop it into `../inbox/` for the Team Lead to triage.

## Key Directories
- `akvj/src/js/core/` — main component, app state, settings
- `akvj/src/js/midi-input/` — MIDI handling
- `akvj/src/js/visuals/` — rendering, layers, clips, effects, masks
- `akvj/src/js/utils/` — utilities

## Constraints
- Do NOT execute any mass-renaming
- Write findings as a single `.md` file in `../inbox/`
- Include specific file/line references for each finding

## Dependencies
- None (can be done in parallel with Task 38b)
