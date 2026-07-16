# Feature Proposal: Rename Workspaces to `akvj` and `mainframe`

## The Proposal
The user is strongly considering a major structural and aesthetic rename of the core workspaces:
- Rename `akvj` folder to `akvj`
- Rename `mainframe` folder to `mainframe`

## Technical Impact & Required Changes
This is a massive refactoring task. The names `akvj` and `mainframe` are hardcoded across hundreds of files in the monorepo. Executing this will require surgical precision across the following areas:

1. **Folder Renaming:** Actually renaming the `akvj` and `mainframe` directories.
2. **NPM Workspaces (`package.json`):** 
   - Root `package.json` workspace definitions and script targeting (e.g., `-w akvj` -> `-w akvj`).
   - Workspace `package.json` files (`name` fields).
3. **Hardcoded Paths in Node Scripts:**
   - The mainframe clip pipeline hardcodes output paths: `path.join(REPO_ROOT, 'akvj/src/public/clips')`. This must be updated to `'akvj/src/public/clips'`.
4. **CI/CD (`.github/workflows/ci.yml`):**
   - GitHub Actions has hardcoded path checks (e.g., `if [ ! -f "akvj/src/public/clips/clips.json" ]`).
5. **Tooling Configs:**
   - `.gitignore`, `.prettierignore`, `.stylelintignore`
   - `eslint.config.js` path overrides.
   - Vitest and Vite configs.
6. **Devcontainers:**
   - `.devcontainer/devcontainer.json` labels and ports.
7. **Documentation & Agent Specs:**
   - `README.md`, `AGENTS.md`, and the prompt instructions inside `.agents/workflows/servers/` all use these terms extensively to define architectural boundaries.

## A Note to the Developer: Things to Think About
Before we pull the trigger on this, we need to think deeply about the long-term consequences of this naming scheme:

- **Ambiguity with "akvj"**: The root repository and the entire project is already called `akvj`. If we rename the specific engine workspace to `akvj` as well, it introduces a semantic collision. When someone says "run npm install in akvj", do they mean the root repo or the engine workspace? `akvj` was very explicit about being the rendering engine.
- **The "Mainframe" Quirks**: Renaming `mainframe` to `mainframe` is undeniably cool, flavorful, and fits an 80s/90s cyberpunk or retro aesthetic perfectly. However, new developers joining the project will have to learn that "mainframe" actually means "the clip management UI and API". 

**Recommendation:**
Take a moment to weigh the aesthetic coolness of `mainframe` and `akvj` against the potential onboarding friction and terminology overlap. If you decide to proceed, we are fully prepared to execute the mass refactoring! Let us know if you want to green-light this plan.
