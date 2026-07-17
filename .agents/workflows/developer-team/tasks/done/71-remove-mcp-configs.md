# Task 71: Remove MCP Configuration Files

## Severity: Low (Cleanup)

## Location
- `.mcp.json` (root)
- `.vscode/mcp.json` (if exists)

## Problem
No active MCPs are in use for the project. Configuration files can be removed to simplify the repo.

## Fix
1. Remove `.mcp.json` from root
2. Remove `.vscode/mcp.json` if it exists
3. Check for any other MCP-related config files and remove them

## Verification
- Run `npm run lint` to ensure no lint errors
- Run `npm run test` to ensure all tests pass
- Verify no references to MCP config remain

## Key Files
- `.mcp.json`
- `.vscode/mcp.json`

## Dependencies
- None
