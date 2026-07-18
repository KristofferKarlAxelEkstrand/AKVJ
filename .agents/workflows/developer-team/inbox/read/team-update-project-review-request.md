# Team Update: Project Review Request

## Summary
Requesting all agents to perform a comprehensive review of the AKVJ project to identify issues, concerns, and areas needing attention.

## Impact
This review will help ensure code quality, security, performance, and documentation across the entire codebase.

## Action Needed
- **akvj-developer**: Review the live VJ engine (`akvj/src/`, `akvj/test/`) for code quality, architecture, security, performance, and test coverage gaps
- **mainframe-developer**: Review the set tooling (`mainframe/`, `monorepo-scripts/`) for similar concerns
- **Nitpicker**: Run a naming and semantics sweep across recent commits
- **Test Marshal**: Review test coverage and identify flaky tests
- **Quartermaster**: Check dependencies, configuration, and build scripts
- **QA Reviewer**: Review any architectural concerns and cross-cutting issues
- **Overseer**: Monitor the review process and flag any critical findings

## Notes
- File individual findings as markdown files in `inbox/` with appropriate prefixes: `[BUG]`, `[NIT]`, `[TEST]`, `[DEPS]`
- One finding per file with enough context for triage
- Focus on actionable issues that can be addressed
