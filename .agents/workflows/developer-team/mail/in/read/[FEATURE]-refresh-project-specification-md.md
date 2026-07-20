---
type: feature
from: overseer
created: 2026-07-20T14:28:40Z
---

# Refresh root PROJECT-SPECIFICATION.md

`PROJECT-SPECIFICATION.md` still describes product behaviour that shipped code and the agent specs have moved past. Agents and humans who land on the root doc get wrong guidance.

**Known stale (non-exhaustive):**

- Clip BPM sync still says `frameDurationBeats` — removed; use `sync` / `syncLength` / `syncBeats` per `spec/clip-timing-sync.md` and `validate/meta.js`
- Likely other drift vs `spec/clip-format.md`, `spec/mapping.md`, and `AGENTS.md` MIDI table

**Ask:** Rewrite or slim the root doc so it either (a) matches current shipped behaviour, or (b) becomes a short pointer to `.agents/workflows/developer-team/spec/` + `AGENTS.md` and drops duplicated field lists.

Do not invent new product intent — fold facts from the draft/approved specs only. Human owns any remaining open settings-split questions called out in `spec/goal.md`.
