# Team Update: package.json cleanup and sorting

## Summary
We should review the root `package.json` (and workspace package.jsons) to clean them up, improve them, and add a tool to automatically sort the file contents.

## Impact
A well-organized and sorted `package.json` makes it easier to read and maintain. It ensures a standard order of fields (e.g., dependencies, scripts, metadata) across the project and prevents merge conflicts caused by arbitrary key ordering.

## Action Needed
1. Review the current `package.json` and remove or consolidate any unused/redundant scripts.
2. Introduce a package to handle sorting, such as `sort-package-json` or `prettier-plugin-packagejson`.
3. Integrate this tool into our formatting pipeline (e.g., as part of the `npm run format:prettier` step or as a pre-commit hook).

## Notes
- Context: The user suggested that a package to automatically sort `package.json` would be a nice addition to the repo.
