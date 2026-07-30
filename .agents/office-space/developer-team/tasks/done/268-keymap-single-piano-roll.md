---
status: done
assignee: mainframe-developer
priority: medium
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Task 268: Single piano roll on `/key-map`

## Description

The `/key-map` route in the Mainframe UI currently renders a mapping panel with two `<piano-roll>` instances (`#mapping-piano-roll` in `edit` mode and `#play-piano-roll` in `play` mode) plus an intermediate channel bar. Update the route so it renders a single, bottom-fixed piano roll component that includes the keybed and a MIDI channel selector.

## Requirements

- Only one `<piano-roll>` element is shown on the `/key-map` (Mapping) panel.
- The piano roll must include the `<key-bed>` (128 keys) and a channel selector (`channel-select`).
- The piano roll must remain sticky to the bottom of the viewport so it stays accessible while the mapping table / clip list scroll above it.
- Preserve existing mapping interactions where possible:
  - Clicking an empty key should allow mapping assignment.
  - Clicking a mapped key/velocity band should select it.
  - The selected channel drives which MIDI channel (1–16) is being edited.
- Remove or hide the second `play` piano roll and the ad-hoc `.piano-channel-bar` / `.piano-roll-dock` wrappers that currently hold the two rolls.

## Affected files

- `mainframe/src/index.html` — reduce the Mapping panel to a single `<piano-roll>`.
- `mainframe/src/js/AkvjMainframe.js` — wire the single piano roll to `mappingchange`, `mappingadd`, `mappingremove`, `keyclick`, and `channelchange` events; remove listeners for the second roll if it no longer exists.
- `mainframe/src/scss/PianoRoll.scss` and/or `mainframe/src/scss/PageShell.scss` — ensure the single roll is bottom-fixed/sticky and the channel selector is visible.
- `mainframe/test/PianoRoll.test.js` and related tests — update any assertions that assume two rolls on the mapping route.

## Verification

1. `npm run lint` passes.
2. `npm run test` passes.
3. `npm run mainframe` (or `npm run build`) renders the Mapping page with one sticky piano roll and a working channel selector.

## Notes

- Keep the existing `<piano-roll>` custom element unchanged; only its usage on the `/key-map` panel should be consolidated.
- The library panel (`/library`) already uses a single `<piano-roll mode="select" channel="1" channel-select>` — that one should stay as-is.
