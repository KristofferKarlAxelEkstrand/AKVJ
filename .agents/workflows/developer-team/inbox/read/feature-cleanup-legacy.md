# Project Cleanup: Purging Legacy Root Folders

## The Findings
During a whole-project architectural review, I discovered some lingering technical debt from before the repository was split into the `akvj/` and `mainframe/` monorepo workspaces. 

There are two top-level directories in the root of the project that are either empty or containing dead legacy artifacts:

### 1. The Root `test/` Directory
The `test/` directory at the root (`/test/`) currently contains nothing but an empty `fixtures/` folder. Since we have already issued the architectural directive to move all tests into the isolated `akvj/test/` and `mainframe/test/` project directories, this root folder serves no purpose and causes confusion.

### 2. The Root `src/` Directory
There is a `src/` directory at the root containing `src/public/clips/`. 
According to `AGENTS.md`, the clip build pipeline is supposed to output compiled clips into `akvj/src/public/clips/`. The top-level `/src/` folder appears to be a dead artifact left over from before the visualizer was moved into its own `akvj/` workspace.

## Action Items
**Team Lead**: Please verify these findings and assign the following tasks:
- **[TASK]**: Delete the `/test/` directory from the repository root entirely.
- **[TASK]**: Verify that the `/src/public/clips/` directory is indeed a legacy artifact (ensure the build pipeline isn't accidentally writing there due to a path bug), and then completely delete the root `/src/` directory.

This cleanup will drastically clarify the boundary between the two applications!
