# Implementation Plan: Animation to Clip Refactor

This is a bulletproof, step-by-step implementation plan to standardizing the AKVJ codebase strictly on VJ terminology by executing a global rename of "animation" to "clip".

## Pre-requisites
1. **Clean Workspace**: Ensure the Git working tree is completely clean before starting.
2. **Git Tracking**: All file and folder renames MUST be performed using `git mv` (or your OS equivalent that Git tracks) to preserve file history.

## Phase 1: File & Directory Renames
Execute structural renames first to establish the new paths:
- **Root Folders**: `git mv animations/ clips/`
- **Public Assets**: `git mv src/public/animations/ src/public/clips/`
- **Build Pipeline**: `git mv scripts/animations/ scripts/clips/`
- **Tools**: `git mv src/tools/animation-preview/ src/tools/clip-preview/`
- **Core Classes**:
  - `git mv src/js/visuals/AnimationLoader.js src/js/visuals/ClipLoader.js`
  - `git mv src/js/visuals/AnimationClip.js src/js/visuals/Clip.js`
- **Tests**:
  - `git mv test/AnimationLoader.test.js test/ClipLoader.test.js`
  - `git mv test/AnimationClip.test.js test/Clip.test.js`

## Phase 2: Build Pipeline & Configuration
Update the infrastructure to point to the new paths:
- **`package.json`**: Replace all `animations` npm scripts with `clips` (e.g., `npm run clips`, `clips:watch`, `clips:clean`, `clips:new`).
- **Pipeline Scripts (`scripts/clips/*`)**: Update the generator scripts so they output to `src/public/clips/clips.json` instead of `animations.json`.
- **`settings.js`**: Update core configuration variables:
  - `animationsBasePath` -> `clipsBasePath` (default: `'/clips/'`)
  - `maxConcurrentAnimationLoads` -> `maxConcurrentClipLoads`

## Phase 3: Core Class & Codebase Renames
Perform surgical find-and-replace operations in the `src/` directory. Be careful to preserve case (e.g., match PascalCase with PascalCase).
- **Class Names**: `AnimationLoader` -> `ClipLoader`, `AnimationClip` -> `Clip`.
- **Imports**: Update all `import` statements across the project to point to the renamed files.
- **Variables/Methods in `ClipLoader.js`**:
  - `setupAnimations()` -> `setupClips()`
  - `animationsMetadata` -> `clipsMetadata`
  - `loadAnimationsJson()` -> `loadClipsJson()`
- **Logging**: Update console logs in `Renderer.js` and `appState.js` (e.g., "JSON for clips loaded").

## Phase 4: Documentation Scrub
Ensure all knowledge bases match the new architecture:
- Thoroughly scrub `AGENTS.md`, `README.md`, `PROJECT-SPECIFICATION.md`, and `CONTRIBUTING.md`.
- Replace "Animation Structure" with "Clip Structure".
- Replace "Animation Metadata" with "Clip Metadata".
- Update all references to `npm run animations`.

## Phase 5: Bulletproof Validation
Execute the following commands sequentially to guarantee the refactor was flawless:
1. `npm run lint:fix` (Ensure no broken imports or stylistic errors were introduced).
2. `npm run clips:clean && npm run clips` (Verify the build pipeline successfully generates `src/public/clips/clips.json`).
3. `npm run test` (Verify all unit tests pass with the new class names and mock structures).
4. `npm run test:visual` (Verify the Chromium visual regression suite passes using the new JSON paths).
5. `npm run dev` (Manually open the browser and verify MIDI input successfully triggers clips on the canvas).

## Rollback Strategy
If any step in Phase 5 fails catastrophically and cannot be immediately fixed via a simple import correction, abort the refactor:
- Run `git reset --hard HEAD`
- Run `git clean -fd` to remove untracked renamed files.


## AI Agent Protocol
- **Read Memory**: Always read `\AKVJ\.agents\prompts\_memory.md` before starting. It contains active context, known bugs, and architectural rules.
- **Update Memory**: If you uncover new edge cases, bugs, or future targets, update `_memory.md`.
- **Evolve Prompt**: If you discover a better way to execute this specific task, update this `.prompt.md` file to permanently document your findings.
