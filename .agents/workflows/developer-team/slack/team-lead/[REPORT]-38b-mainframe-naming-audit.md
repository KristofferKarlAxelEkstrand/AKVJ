# [REPORT] 38b: Mainframe Naming Conventions Audit

## Status: ✅ Complete — No Violations Found

## Audit Results

### 1. File Naming ✅
All 9 files in `mainframe/src/js/` follow the convention:
- **PascalCase** (class exports): `ClipEditor.js`, `ClipList.js`, `MappingTable.js`, `PianoKeyboard.js`, `StagingPreview.js`, `StickyPianoRoll.js`
- **lowercase** (utility modules): `apiClient.js`, `mainframeState.js`, `playbackUtils.js`

### 2. Descriptive Names ✅
No vague terms (`data`, `state`, `val`, `thing`, `obj`, `item`, `temp`) found in any source file. All variables use domain-oriented names:
- `clipMetadata`, `spriteImage`, `frameRatesForFrames`, `channelMappingByNote`, `playbackMode`, `shuffleState`, `pingpongState`, `stagedImages`, `mappingTableElement`, `clipListElement`, etc.
- Standard abbreviations (`img`, `ctx`, `li`) are acceptable per common convention.

### 3. Private Fields/Methods ✅
All 8 classes consistently use `#` prefix for internal state and methods:
- `ShuffleState`: `#order`, `#position`, `#frameCount`, `#reshuffle()`
- `PingpongState`: `#direction`
- `MainframeState`: `#clips`, `#mappings`, `#channel`, `#searchQuery`, `#roleFilter`, `#sortMode`, `#dispatchStateEvent()`
- `AkvjPianoKeyboard`: `#mappings`, `#channel`, `#hasRenderedKeys`, `#render()`, `#createKeyElement()`, `#updateMappedKeys()`
- `AkvjStickyPianoRoll`: `#mappings`, `#channel`, `#activeFilterNote`, `#hasRenderedKeys`, `#render()`, `#createKeyElement()`, `#toggleFilter()`, `#updateFilterHighlight()`, `#updateMappedKeys()`
- `AkvjClipList`: `#clips`, `#searchQuery`, `#roleFilter`, `#sortMode`, `#activePreviewPlayers`, all methods `#` prefixed
- `AkvjStagingPreview`: `#stagedImages`, `#currentFrame`, `#playbackMode`, `#shuffleState`, `#pingpongState`, all methods `#` prefixed
- `AkvjClipEditor`: `#clip`, `#render()`, `#setStatus()`, `#createField()`, `#createNumberInput()`, `#createCheckbox()`, `#createTextInput()`
- `AkvjMappingTable`: `#mappings`, `#clipCatalog`, `#render()`, `#renderSummary()`, `#renderTable()`

### 4. Bound Handlers ✅
No cached bound methods exist in any class. All event listeners use inline arrow functions, so the `#bound` prefix convention is not applicable.

### 5. Explicit & Readable ✅
All names clearly indicate purpose. No overly abbreviated or cryptic names found.

## Verification
- `npm run lint` — ✅ passes (0 errors)
- `npm run test -w mainframe` — ✅ 165 tests pass (14 test files)
