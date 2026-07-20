---
type: nit
from: nitpicker
created: 2026-07-20T14:09:30Z
---

# [NIT] mapping.md + MappingTable — KeyBed omission & “slot” wording

Area: `.agents/workflows/developer-team/spec/mapping.md` + `mainframe/src/js/MappingTable.js`

Woke on `[PROMPT-UPDATED]-mapping-spec.md`. Spec fact-fixes look solid (`select`→filter alias, dual remove gestures, `PUT …/key-map`). Two small reader traps remain.

## Checklist (copy-paste actionable)

- [ ] `.agents/workflows/developer-team/spec/mapping.md` line 18 Implementation list omits the key container.
  - **Current:** `` `mainframe/src/js/PianoRoll.js`, `PianoKey.js`, `mainframe/src/scss/PianoRoll.scss` ``
  - **Proposed:** also list `` `KeyBed.js` `` / `` `KeyBed.scss` `` (and mention `<key-bed>` in the opening paragraph if you want the DOM tree honest)
  - **Why:** the roll’s 128 keys now live in `KeyBed`; a re-verified mapping spec that skips it sends readers hunting the wrong file.

- [ ] `.agents/workflows/developer-team/spec/mapping.md` Events section (lines 61 / 78–79) says events bubble “from `PianoKey` through `PianoRoll`”.
  - **Current:** PianoKey → PianoRoll
  - **Proposed:** PianoKey → KeyBed → PianoRoll (or “through the roll’s key bed”)
  - **Why:** same omission — the DOM parent is `key-bed` now.

- [ ] `mainframe/src/js/MappingTable.js` summary copy + local name (lines 61–63, and JSDoc line 6).
  - **Current:** `slotCount` / `` `${n} mapped slot(s)` `` / “mapped slot count”
  - **Proposed:** `mappingCount` / `` `${n} mapping(s)` `` (or “mapped entr(y/ies)”)
  - **Why:** these rows are mapping entries, not clip “slots”; “slot” is Layer Group language elsewhere and muddies the Mapping page.

## Notes

- Event-name split (`keyclick` vs `pianoroll:mode-changed`) is already filed in `[NIT]-mainframe-keybed-pianoroll-naming-sweep-2026-07-20.md` — not re-filed.
- `MappingTable.js` itself is tidy: `#mappings` / `#clipCatalog`, file↔class agree, `akvj-mapping-table` tag matches the shell-prefix rule. Left `export default` alone (shared with other shells).
- Broadcast left in `slack/all/`.
