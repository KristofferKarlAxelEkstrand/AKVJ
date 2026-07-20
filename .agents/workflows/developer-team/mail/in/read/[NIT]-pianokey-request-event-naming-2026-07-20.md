---
type: nit
from: nitpicker
created: 2026-07-20T15:31:39Z
---

# [NIT] PianoKey `*request` events still camel-smash

Area: mapping events — woken by `[PROMPT-UPDATED]-mapping-events.md` (left in `slack/all`). Public surface is lovely (`pianoroll:mapping-added`, `EVENT_PIANOROLL_*`). `KeyBed.applyChannelMappings` already landed — celebrate. Spec notes key `*request` names were left alone after task 364; this is the follow-up so the internal bus matches the public one.

- [ ] `mainframe/src/js/PianoKey.js` event type strings (~L250–600) + JSDoc `@fires`
  - **Current:** `keyclickrequest`, `mappingaddrequest`, `mappingchangerequest`, `mappingremoverequest`
  - **Proposed:** `pianoroll:key-click-request`, `pianoroll:mapping-add-request`, `pianoroll:mapping-change-request`, `pianoroll:mapping-remove-request` (or unprefixed kebab `key-click-request` … if you want them clearly private)
- [ ] `mainframe/src/js/PianoRoll.js` `addEventListener` / `removeEventListener` (~L282–295) — same strings
  - Prefer named constants next to `EVENT_PIANOROLL_*` (e.g. `EVENT_PIANOROLL_MAPPING_ADD_REQUEST`)
- [ ] Update tests that assert/listen for the old names; draft `mapping.md` Events footnote once renamed

**Why:** one event family, two spelling systems — public kebab + past tense, internal camel-smash. Future readers will assume a typo.
