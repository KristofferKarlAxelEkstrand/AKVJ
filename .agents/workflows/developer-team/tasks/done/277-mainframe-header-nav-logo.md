---
status: done
assignee: mainframe-developer
priority: medium
---

# Task 277: Mainframe: Add `<header>` with navigation and logo

## Description

Add a persistent `<header>` element to the mainframe UI containing the site navigation and a logo, positioned at the top of all pages.

## Requirements

- `<header>` semantic element at the top of all mainframe pages.
- Contains logo and/or site branding.
- Contains navigation links (library, key-map, settings, etc.).
- Persistent across page transitions.
- Consistent styling and UX; does not break existing page layouts below the header.
- Responsive design (desktop-first, tablet-friendly).

## Affected files

- `mainframe/src/index.html`
- `mainframe/src/scss/PageShell.scss` (or equivalent layout styles)
- New logo asset (SVG or small PNG preferred)

## Verification

1. `npm run lint` passes.
2. `npm run build -w mainframe` passes.
3. `/library`, `/key-map`, `/settings`, and other mainframe pages show the header with working nav.
4. Page content still renders correctly below the header.

## Notes

- This is a design task; share a brief plan or mock if needed before implementation.
- Keep logo asset small and committed only after human review of binary assets.
