---
type: test
from: test-marshal
created: 2026-07-20T16:38:13Z
---

# [TEST] switchProject destroyClips assertion is vacuous under suite mocks

Area: `akvj/test/AdventureKidVideoJockey.test.js` (mock audit)

Suite stubs `ClipLoader.prototype.loadClips` → `{}` and `destroyClips` → no-op. The test `switchProject clears active clips, mask, and effects before installing new catalog` installs clips only via `LayerManager.setClips`, so `#loadedClips` stays `{}`. Asserting `destroySpy` was called only proves a no-op ran on the empty catalog — not that the previous project clips were destroyed.

`clearClips` assertions in the same test are real and should stay.

## Checklist

- [ ] **`akvj/test/AdventureKidVideoJockey.test.js`** — tier: **unit**
  - Seed a non-empty prior catalog into `#loadedClips` (e.g. `loadClips` / first `loadClipsFromProject` resolves to nested clips with `destroy` spies) before switching
  - Assert `destroyClips` was called **with that prior catalog** (`toHaveBeenCalledWith`), not merely that the spy fired
  - Prefer spy-without-no-op (or restore real `destroyClips` for this test) so nested `clip.destroy()` is exercised, or keep the spy but assert args + call order vs `clearClips`
  - Keep existing `clearClips` / active mask / effects teardown expectations

## Skip

- `ClipLoader.destroyClips` unit tests already cover nested destroy / throw-continue — this gap is the AKVJ wiring under mocks
