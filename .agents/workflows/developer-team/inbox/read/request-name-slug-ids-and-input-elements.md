# Team Update: Clip ID = slugified clip name + self-cleaning input elements

**Note:** this changes direction from the earlier 4-char random ID idea
(`request-simple-clip-ids.md` / `clarification-clip-id-collision-strategy.md`).
The ID should now be derived from the **whole clip name**, not a short random combo.

## Summary

Turn the full clip **name** into the **ID** as a slug. Example:

- Name: `My really nice clip`
- ID: `my-really-nice-clip`

Allowed ID characters: **lowercase letters, numbers, and hyphens**. Everything else is
transliterated or stripped as part of slugging.

## Slug rules

- **Lowercase** everything.
- **Transliterate diacritics** to their base ASCII letter:
  - `å` → `a`, `ä` → `a`, `ö` → `o` (so `åäö` → `aao`)
  - `é` → `e`, and similar for other accented characters.
- **Spaces → hyphens**, but collapse runs first (see name cleaning below) so we never get `--`.
- Strip any remaining disallowed characters.
- Trim leading/trailing hyphens.

So `Jag är bäst` → name stays readable, ID becomes `jag-ar-bast`.

## Name cleaning (do this in the frontend, live)

Clean the **name** as the user types, not just on save:

- **Trim trailing (and leading) spaces.**
- **Collapse multiple spaces** to a single space — `Jag      är bäst` becomes `Jag är bäst`.
- Keep the name human-readable (accents/case preserved in the *name*); only the *ID* is slugged.

The gate on names should be **reasonably permissive**: things like `Jag är bäst` are fine.
We just want basic hygiene (no leading/trailing/duplicate spaces, not empty), not a strict whitelist.

## Self-cleaning input custom elements

Make **each input its own custom element** so it owns its validation/cleaning behavior
instead of scattering that logic across forms. This keeps inputs reusable and consistent.

- **Start with the name input.** It should clean spaces live and expose the derived slug/ID.
- Same pattern can later cover other fields (durations, ids, numbers, etc.).
- Keep it vanilla JS / light-DOM custom elements per repo conventions
  (see the `custom-elements-frontend` skill).

## Action Needed

- Derive clip ID from the full name via the slug rules above (letters, numbers, hyphens only).
- Add a solid transliteration step for diacritics (`åäö` → `aao`, `é` → `e`, etc.).
- Clean the name **live in the frontend**: trim + collapse repeated spaces.
- Build inputs as **self-managing custom elements**, starting with the name input that
  emits/updates the derived ID in real time.
- Keep name validation permissive but hygienic (no empty, no stray/duplicate spaces).

## Notes

- Ties into the earlier request that the ID update **in real time** in the editor/uploader
  as the name changes (`request-simple-clip-ids.md`).
- Collision handling still matters: two clips could slug to the same ID
  (e.g. `My clip` and `my  clip`) — reuse a dedupe strategy (suffix like `-2`, or the
  earlier grow/regenerate idea) and document it in the task.
- Reminder: IDs stay immutable after first create per the edit-clip spec — so the
  name→ID derivation is a **create-time** convenience, and renaming later doesn't rewrite the ID.
