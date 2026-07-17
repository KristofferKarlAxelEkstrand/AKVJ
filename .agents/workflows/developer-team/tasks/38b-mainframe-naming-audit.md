# Task 38b: Mainframe Naming Conventions Audit

## Objective
Audit the `mainframe/` tooling/UI codebase for naming conventions and consistency. Compile findings and proposed schemas without making changes.

## Review Criteria

### 1. Variable Names
- Are there any overly terse or confusing variable names?
- Are all names descriptive and domain-oriented? (e.g., `clipMetadata` not `data`)
- Are magic numbers extracted to named constants?

### 2. Class & Function Names
- Do class names accurately describe what they do?
- Are function names clear about their purpose?
- Are private methods prefixed with `#`?

### 3. File Names
- Are PascalCase files only used for class-exporting modules?
- Are lowercase/camelCase files used for all other modules?

### 4. Cross-Project Consistency
- Are naming patterns in `mainframe` consistent with those in `akvj`?
- Are there contradictions in naming schemas between the two projects?

## Output
Do NOT make any code changes. Compile a list of findings and proposed naming schemas into a markdown file and drop it into `../inbox/` for the Team Lead to triage.

## Key Directories
- `mainframe/src/js/` — frontend UI code
- `mainframe/server/` — backend API server
- `mainframe/scripts/clips/` — clip pipeline

## Constraints
- Do NOT execute any mass-renaming
- Write findings as a single `.md` file in `../inbox/`
- Include specific file/line references for each finding

## Dependencies
- None (can be done in parallel with Task 38a)
