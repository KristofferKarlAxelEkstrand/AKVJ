# Task 219: Extension Packaging and Installation Guide

## Severity: High (Blocker — the extension cannot be used without this)

## Location
- `devin-team-controller/package.json`
- `devin-team-controller/` — new `.vscodeignore` file
- New doc: `devin-team-controller/INSTALL.md`

## Problem

The extension has no way to be installed in Devin Desktop. There is no:
- `vsce` packaging step (no `.vsix` file can be built)
- `.vscodeignore` (build output would include test files, `node_modules`, source maps)
- Install instructions

The only way to run the extension right now is via VS Code's "Open Folder" + "Run Extension" in the Extension Development Host — which is a development mode, not a real install. For the team to actually use the extension day-to-day, it needs to be packaged as a `.vsix` and installed into Devin Desktop.

## Requirements

### 1. Add `vsce` to devDependencies
```bash
npm install --save-dev @vscode/vsce
```

### 2. Add packaging scripts to `package.json`
```json
{
  "scripts": {
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "lint": "eslint src --ext ts",
    "test": "vitest run",
    "test:watch": "vitest",
    "package": "npm run compile && vsce package",
    "package:prerelease": "npm run compile && vsce package --pre-release"
  }
}
```

### 3. Create `.vscodeignore`
Exclude everything that shouldn't be in the `.vsix`:
```
.vscode/**
.vscode-test/**
src/**
test/**
spike/**
out/**/*.map
!out/**
node_modules/**
.gitignore
.eslintrc.json
tsconfig.json
vitest.config.ts
**/*.test.ts
**/*.test.js
```

### 4. Create `INSTALL.md` with:
- **Prerequisites**: Devin Desktop installed, `devin auth login` completed (or `WINDSURF_API_KEY` set)
- **Build the `.vsix`**: `cd devin-team-controller && npm install && npm run package`
- **Install in Devin Desktop**: Extensions panel → `...` menu → "Install from VSIX..." → select the generated `.vsix`
- **First run**: Click "Developer Team" in the activity bar → "Start Team" button
- **Configuration**: Which agents to enable, model selection, workspace root assumptions
- **Workspace root assumption**: The extension uses `vscode.workspace.workspaceFolders[0].uri.fsPath` as the root. The repo must be opened at the AKVJ workspace root (not a subdirectory).
- **Uninstall**: Extensions panel → right-click → Uninstall

### 5. Verify `main` in `package.json`
Confirm `"main": "./out/extension.js"` is correct and the compiled output is at that path after `npm run compile`.

## Acceptance Criteria
- [ ] `npm run package` produces `devin-team-controller-0.1.0.vsix` (or similar)
- [ ] `.vsix` does not include `src/`, `test/`, `node_modules/`, or source maps
- [ ] `.vsix` does include `out/`, `webview/`, `media/`
- [ ] `INSTALL.md` covers prerequisites, build, install, first-run, and uninstall
- [ ] Package size is reasonable (< 5 MB without node_modules)

## Verification
```bash
cd devin-team-controller
npm run package
# Should produce *.vsix file
ls -lh *.vsix
# Inspect contents
unzip -l *.vsix | head -40
```

## Notes
- `vsce` may warn about missing `repository`, `license`, or `icon` fields in `package.json`. These are warnings, not errors — the `.vsix` will still build. Fill them in if time permits.
- `vsce` also bundles dependencies from `node_modules` by default (for extensions that have runtime deps). Our extension has no runtime npm deps (only devDeps) — check that `@agentclientprotocol/sdk` is in the right category, or that the ACP types/logic are inlined.
- If the extension needs to bundle `@agentclientprotocol/sdk` at runtime, add it to `dependencies` (not `devDependencies`) and verify `vsce` includes it.
- Devin Desktop is a VS Code fork — `.vsix` format is identical to standard VS Code extensions. The install process is the same.

## References
- `devin-team-controller/package.json`
- Devin Desktop docs — extension installation
- VS Code docs — Extension packaging with vsce

## Completed

**Date**: 2026-07-18
**Changed**:
- `devin-team-controller/package.json` — added `@vscode/vsce: ^3.0.0` to `devDependencies`; added `"package"` and `"package:prerelease"` scripts using `vsce package --no-dependencies`.
- `devin-team-controller/.vscodeignore` — created; excludes `src/`, `test/`, `spike/`, `node_modules/`, source maps, config files.
- `devin-team-controller/INSTALL.md` — created; covers prerequisites, binary discovery, build, install, first-run, configuration (model, MCP, workspace root), sending messages, stopping, uninstall, and troubleshooting.
**Note**: `npm install` needed to pull `@vscode/vsce` before `npm run package` will work. Run in `devin-team-controller/` dir.
