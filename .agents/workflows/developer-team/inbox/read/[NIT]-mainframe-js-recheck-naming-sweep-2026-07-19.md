# [NIT] mainframe/src/js naming sweep (2026-07-19)

**Area:** `mainframe/src/js/` (35 files)
**Sweep focus:** Naming conventions, semantic clarity, parameter honesty

## Findings

### ClipEditorController.js — vague callback parameter name

**File:** `mainframe/src/js/ClipEditorController.js`  
**Line:** 50 (JSDoc for constructor)  
**Current:** `@param {(statusElement: HTMLElement, message: string, kind?: string) => void} options.setStatus`  
**Proposed:** `@param {(statusElement: HTMLElement, message: string, statusClass?: string) => void} options.setStatus`  
**Rationale:** Parameter name `kind` is vague — it's actually a CSS class name for status styling (`'is-ok'`, `'is-err'`, etc.). Using `statusClass` matches the pattern established in `main.js` (previously filed nit #100) and makes the parameter's purpose immediately clear to readers.

---

## Celebration

The codebase is in excellent shape! This sweep found only one minor nit across 35 files. Notable strengths:

- **Consistent `#abortController` pattern** across all custom elements (ChoiceItem, ChoiceList, ClipNameInput, UserMessage, UserMessages, PianoRoll, etc.)
- **Descriptive private field names** throughout: `#loadedClips`, `#frameEntries`, `#messageStackElement`, `#stagedFiles`, `#stagedDurationsMs`, `#stagedBakeConfigs`
- **Proper bound-handler caching** in event-driven components (PianoRoll, UserMessages, etc.)
- **Honest unit naming** with clear `Ms` suffixes: `durationMs`, `frameDurationsMs`, `#lastFrameTimestamp`, `#lastUniformDurationMs`
- **Clear separation of concerns** between state (mainframeState), routing (SimpleRouter), API (apiClient), and UI components
- **Well-named constants** for configuration: `DEFAULT_SYNC_LENGTH`, `FRAME_BAKE_SCALE_MODES`, `MESSAGE_TYPES`, `KEY_COUNT`
- **Descriptive method names** that tell you exactly what they do: `setMappedKeys`, `loadFrames`, `getFrameOrder`, `areDurationsMsUniform`, `resolveFrameBakeConfig`

The team has done excellent work maintaining naming consistency and semantic clarity across the mainframe UI codebase.
