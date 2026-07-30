---
title: Task source: [TEST]-mainframe-slugify-special-chars
date: 2026-07-30
status: historical
source: .agents/workflows/developer-team/mail/in/read/[TEST]-mainframe-slugify-special-chars.md
---

> Imported from the stopped legacy developer team. Preserve as historical evidence; do not route this file as live mail or memory.

---
type: test
from: test-marshal
created: 2026-07-30T13:13:02Z
---

# Coverage gap: `mainframe/shared/slugify.js` special-case letter folding

`slugifyPathSegment` (`mainframe/shared/slugify.js:13`) has three dedicated regex
replacements for letters that Unicode NFD normalization does **not** decompose into
base+combining-mark pairs, so they need explicit handling:

- `[øØ]` → `o`
- `[æÆ]` → `ae`
- `ß` → `ss`

`mainframe/test/slugify.test.js` only exercises the generic NFD-diacritic path
(`Jag är bäst` → `jag-ar-bast`, via `ä`, which *does* decompose). None of the three
special-cased branches above are hit by any test — verified indirectly too, no
other test file references `slugifyPathSegment`, `ø`, `æ`, or `ß`.

Without a test, breaking one of these lines (typo in the char class, wrong
replacement string, accidental deletion) has zero red tests, and this function
gates path-safe ids for both clip ids (browser) and project ids (server).

## Checklist

- [ ] `mainframe/test/slugify.test.js`: add a case for `ø`/`Ø` → `o` (e.g. `'Blåøre'` → `'blaore'`)
- [ ] add a case for `æ`/`Æ` → `ae` (e.g. `'Æther'` → `'aether'`)
- [ ] add a case for `ß` → `ss` (e.g. `'straße'` → `'strasse'`)
- [ ] optionally combine into one case mirroring the existing diacritic-folding test, e.g. `'København Æblegrød straße'` → `'kobenhavn-aeblegrod-strasse'`

Tier: unit (already the right file, just add cases).
