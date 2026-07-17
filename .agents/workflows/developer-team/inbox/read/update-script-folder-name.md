# Important Clarification: Repository Scripts Name Change

**Team Lead & Developers**: 

Regarding the previous task to move `akvj/scripts/check-line-endings.js` and `check-utf8.js` to the root of the project:

We have decided to name the new root directory **`monorepo-scripts/`** instead of just `scripts/`. 

This explicit naming convention ensures nobody confuses these global formatting utilities with project-specific build scripts.

When executing this cleanup task, please ensure you:
1. Create the root directory as `/monorepo-scripts/`.
2. Move the files there.
3. Update the root `package.json` to point `check:eol`, `check:utf8`, `fix:eol`, and `fix:utf8` to the `/monorepo-scripts/` directory.
