---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 135: Clip ID = Full Name Slug (Direction Change from Task 131) + Self-Cleaning Name Input

## Source
User request: `.agents/workflows/developer-team/inbox/read/request-name-slug-ids-and-input-elements.md`

## Important — This Reverses Part of Task 131 (Just Shipped/Approved)
Task 131 (`tasks/done/131-simple-clip-ids-name-derived.md`) built a **4-character**
name-derived ID with truncate/pad + length-growth-on-collision
(`mainframe/src/js/generateClipId.js`). The user has now changed direction: **the ID should
be the full slugified name**, not truncated to 4 chars, and collisions should dedupe with a
numeric suffix (e.g. `-2`) rather than growing length. This is a deliberate, explicit
reversal per fresh user direction (the user's own note calls this out) — proceed with the
new behavior, don't push back citing Task 131.

What to keep from Task 131: the live-update-as-you-type wiring
(`ClipEditorController.refreshGeneratedClipId()`), the immutable-after-first-save behavior,
and collision-checking against `mainframeState.clips`. What changes: the slug algorithm
itself and the collision-resolution strategy.

## Current State
- `mainframe/src/js/generateClipId.js`:
  - `slugifyClipName(name)` (line 32-36) — lowercases and **strips** all non-`[a-z0-9]`
    chars (no hyphen preservation, no diacritic transliteration, spaces just vanish).
  - `fitSlug()` (line 78-89) — truncates/pads slug to a fixed `length` (4, growing on
    collision). This truncation approach goes away for the name-derived path.
  - `candidateFromSlug()` / `generateClipId()` (line 100-138) — the length-growth loop.
    Needs reworking: for name-derived IDs, there's no target length to grow — the ID *is*
    the slug, and collisions get a suffix instead.
  - `isValidClipId()` (`shared/clipId.js`) already accepts hyphens — no pattern change needed
    there, just make sure trimmed/collapsed slugs still satisfy "not all-digit" and don't
    start with a disallowed character.

## New Slug Rules (replace `slugifyClipName`)
1. Lowercase everything.
2. **Transliterate diacritics** to base ASCII (e.g. `å`/`ä` → `a`, `ö` → `o`, `é` → `e`, and
   the general Latin diacritic range — a normalize-and-strip-combining-marks approach via
   `String.prototype.normalize('NFD')` + stripping combining marks is the standard technique;
   verify it covers `åäö` → `aao` and similar cases as JS built-ins allow).
3. Spaces → hyphens, but **collapse runs of whitespace first** so you never emit `--`.
4. Strip any remaining disallowed characters (only lowercase letters, numbers, hyphens survive).
5. Trim leading/trailing hyphens.
6. Example: `"Jag är bäst"` → `"jag-ar-bast"`.

## Collision Handling (per user clarification)
- ID = full slug on first attempt.
- On collision (e.g. `"My clip"` and `"my  clip"` both slug to `"my-clip"`), append a numeric
  suffix and increment until free: `my-clip`, `my-clip-2`, `my-clip-3`, …
- Document this choice (suffix style, separator) in the report — it replaces Task 131's
  length-growth strategy for this path. Empty/no-name case (no name entered) can keep a
  short random fallback (reuse existing `randomAlnum` path) since there's nothing to slug.

## Name Field Cleaning (live, in the frontend)
- Trim leading/trailing spaces as the user types.
- Collapse multiple consecutive spaces to one.
- Keep the **name** human-readable — accents/case/spaces preserved in the name itself; only
  the derived ID is slugged.
- Validation stays permissive: non-empty after cleaning is the only hard gate.

## Self-Cleaning Input Custom Elements (new pattern — scope to the name input only)
- Build the name field as its own light-DOM custom element that owns its cleaning/validation
  behavior (trim + collapse-spaces on input), rather than cleaning logic living inline in
  `ClipEditorController`. Follow existing light-DOM custom-element conventions in this repo
  (see `custom-elements-frontend` skill; `ClipFrame.js` for a small, focused example).
- It should expose the cleaned name and let `ClipEditorController` derive the ID from it (live,
  matching the existing `refreshGeneratedClipId()` wiring from Task 131).
- **Scope**: only the name input for this task. The user explicitly said other fields
  (durations, ids, numbers) can adopt the same pattern *later* — don't build that now, just
  don't make choices that would make it hard to do later (e.g. keep the element generic
  enough in spirit, but don't over-engineer a generic base class nobody's asked for yet).

## Suggested Tests
- Slug function: diacritics, space-collapsing, leading/trailing hyphen trim, disallowed-char
  stripping, the two examples above (`"My really nice clip"` → `"my-really-nice-clip"`,
  `"Jag är bäst"` → `"jag-ar-bast"`).
- Collision dedupe: two names slugging to the same base get `-2`/`-3` suffixes.
- Name-input custom element: typing `"Jag      är bäst"` cleans live to `"Jag är bäst"`.
- `ClipEditorController`: ID field updates live from the cleaned name; read-only/unchanged
  when editing an existing clip (unchanged from Task 131).

## Files
- `mainframe/src/js/generateClipId.js` (slug + collision logic)
- `mainframe/src/js/ClipEditorController.js` (`refreshGeneratedClipId()` wiring)
- New: name-input custom element under `mainframe/src/js/`
- `mainframe/shared/clipId.js` (reference — pattern likely unchanged, verify hyphens ok)
- `.agents/workflows/developer-team/spec/feature-edit-clip.md` (update ID section)
