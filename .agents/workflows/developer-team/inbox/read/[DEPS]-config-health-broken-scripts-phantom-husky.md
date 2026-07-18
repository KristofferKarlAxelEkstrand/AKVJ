# [DEPS] Config health: broken smoke scripts + phantom Husky/lint-staged in README

**Filed by:** The Quartermaster  
**Date:** 2026-07-18  
**Focus:** config/scripts/engines health + 🎲 special mission (version truth)  
**Priority:** Medium — broken scripts will fail if invoked  

---

## Findings

### 1. Broken smoke test scripts (wrong file extensions)
- **Current:** Root `package.json` scripts reference files with `.test.js` extension:
  - `"test:smoke": "node mainframe/test/smoke/startup.test.js"` (line 60)
  - `"test:smoke:mainframe": "node mainframe/test/smoke/mainframe-startup.test.js"` (line 61)
- **Reality:** The actual files on disk are:
  - `mainframe/test/smoke/startup.smoke.js`
  - `mainframe/test/smoke/mainframe-startup.smoke.js`
- **Impact:** Both scripts will fail with "module not found" if run. Additionally, `test:e2e:all` (line 64) calls `npm run test:smoke` so it is also broken.
- **Proposed:** Update the two script paths: `.test.js` → `.smoke.js`
- **Risk:** Low — fixing broken paths to match reality

### 2. README.md references Husky and lint-staged that don't exist
- **Current:** `README.md` line 277: "This project uses **Husky** and **lint-staged** to automatically run linting and formatting on staged files before each commit. No manual setup required after `npm install`."
- **Reality:**
  - No `husky` or `lint-staged` in any `package.json` devDependencies
  - No `.husky/` directory exists
  - No `lint-staged` config in any JSON file
- **Impact:** Misleading documentation — developers may expect pre-commit hooks that don't run
- **Proposed:** Remove the "Git Hooks" section from README.md (lines 275–277), or alternatively install Husky + lint-staged if pre-commit hooks are desired (that's a product decision for the Team Lead/human)
- **Risk:** Low — docs correction

### Special mission note: Version truth
The CONTRIBUTING.md Node 18+ vs reality (engines >=20, CI Node 20, devcontainer Node 22) mismatch was already filed in `[DEPS]-version-skew-lockfile-config-cleanup.md` (item 3). No additional version disagreements found — README.md and AGENTS.md both correctly document the Node 20/22 situation.

---

## Sequencing notes for Team Lead
- Item 1 is a quick `package.json` script fix — no lockfile impact.
- Item 2 is a docs-only edit — no lockfile impact.
- No `[LOCK]` or `[NPM-REQUEST]` needed for either item.
