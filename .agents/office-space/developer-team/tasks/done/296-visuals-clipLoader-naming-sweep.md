---
status: done
assignee: none
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 296: AKVJ visuals `ClipLoader.js` naming nits

## Description

Non-behavioral naming/semantics cleanup in `akvj/src/js/visuals/ClipLoader.js` and its callers/tests.

## Findings

### 1. Vague `setup*` verbs for clip-loading methods
- **Files**: `akvj/src/js/visuals/ClipLoader.js` (lines 298, 312); callers in `akvj/src/js/core/AdventureKidVideoJockey.js` (lines 147, 263) and `akvj/test/AdventureKidVideoJockey.test.js` (mock spies)
- **Current**:
  - `async setupClips(clipsJsonUrl = ..., keyMapJsonUrl = ...)`
  - `async setupClipsFromProject(projectId)`
- **Proposed**:
  - `async loadClips(clipsJsonUrl = ..., keyMapJsonUrl = ...)`
  - `async loadClipsFromProject(projectId)`
- **Rationale**: These methods fetch the catalog and key-map, instantiate clips, and return the nested `{channel: {note: {velocity: Clip}}}` tree — they *load*, not just configure. `load*` aligns with the existing private helper `#loadClipsFromKeyMap` and matches the project's prior `#setupClips` → `#loadClipsFromUrl` rename in `AdventureKidVideoJockey.js`.

### 2. `destroy(clips)` semantically destroys an external object, not the loader
- **File**: `akvj/src/js/visuals/ClipLoader.js` (line 442); callers in `akvj/src/js/core/AdventureKidVideoJockey.js` (lines 152, 254) and `akvj/test/AdventureKidVideoJockey.test.js` (`ClipLoader.prototype.destroy` spy)
- **Current**: `destroy(clips) { ... }` iterates the passed-in `clips` object and calls `clip.destroy()` on each clip.
- **Proposed**: `destroyClips(clips) { ... }` (or `disposeClips(clips)`)
- **Rationale**: A `destroy()` method on an instance should release the instance's own resources. This method is a utility that destroys an external clips object; it also conflicts with the pattern used by `Clip`, `LayerGroup`, and `Renderer`, where `destroy()` destroys `this`. Renaming makes the call site `this.#clipLoader.destroyClips(this.#loadedClips)` read like plain English.

### 3. Inconsistent velocity key naming inside `ClipLoader.js`
- **File**: `akvj/src/js/visuals/ClipLoader.js` (lines 358, 179, 209, 228, 423)
- **Current**:
  - `#buildLoadTasks` destructures the key as `velocity` and passes it to `#loadMappedClip` (line 358)
  - `#loadMappedClip`, `#validateMappingEntry`, `#validateNumericKeys`, and `#buildClipsObject` all name the same value `velocityThreshold`
- **Proposed**: Standardize on `velocityThreshold` throughout `ClipLoader.js` (rename the loop variable in `#buildLoadTasks` from `velocity` to `velocityThreshold`)
- **Rationale**: The same concept should have one name within a module. `velocitySelection.js` already calls these keys "velocity thresholds" and uses a floor-strategy lookup, so `velocityThreshold` is the honest canonical term. This makes the pipeline read consistently from key-map iteration through to the built clip tree.

## Affected files

- `akvj/src/js/visuals/ClipLoader.js`
- `akvj/src/js/core/AdventureKidVideoJockey.js`
- `akvj/test/AdventureKidVideoJockey.test.js`

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. No runtime behavior changes.

## Notes

- Naming/semantics only; do not change clip-loading behavior.
