# Hyper — Product Information Document

**Status:** Vision / planning (no implementation yet)
**One-liner:** A browser-native design tool that edits real HTML at 1:1 — simple for designers, semantically excellent for AI.

---

## 1. Goal

Build a **design tool that outputs HTML**.

You design in the browser. What you see is the real page — not a canvas mock, not a framework abstraction. The saved result is loadable HTML (plus styling and light interaction) that an AI can read as the design source of truth.

**Primary success metric:** An AI (or a human) can open the saved document and understand structure, styling intent, states, and interactions without reverse-engineering a proprietary format.

**Secondary success metric:** A designer can build useful pages without thinking like a frontend engineer — even though the underlying model is HTML.

---

## 2. Product thesis

Most design tools fake the web. Hyper **is** the web.

| Typical design tool                  | Hyper                                   |
| ------------------------------------ | --------------------------------------- |
| Draws on a canvas, then exports HTML | Edits live HTML; the page _is_ the work |
| Zoom/pan like Figma                  | Browser zoom only; layout is true CSS   |
| Proprietary file format              | Repo-friendly HTML + CSS                |
| Pretty for humans, messy for AI      | Semantic, readable, intentional for AI  |

The chrome around the page (outliner, inspector, overlays) must never become part of the published document. The document stays clean.

---

## 3. Who it is for

1. **Designers** who want to shape real pages without fighting code first.
2. **AI-assisted workflows** where the design file _is_ the brief: structure + style + states + light behavior.
3. **Builders** who prefer HTML/CSS (and small event-driven JS) over React/Vue canvases.

Not aimed at: full IDE replacement, CMS content authoring, or pixel-art / game-style canvas tools.

### 3.1 Three concrete user journeys

#### Journey 1: Design a website directly in a repo

A designer installs or runs Hyper as a local npm tool, points it at a repo, and creates `design-specs/my-homepage/`. Hyper opens on localhost with the real page in the stage. The designer adds semantic sections, text, images, and layout; changes colors and spacing; and sees every edit autosaved as readable HTML and CSS in that folder.

When the design is ready, **Prepare for AI** validates and summarizes the existing files. It does not create a second proprietary copy. The designer can then ask an AI to build from `design-specs/my-homepage/`, where the rendered design, CSS variables, data, assets, and written design intent live together.

#### Journey 2: Build a seal homepage from data

A designer creates a homepage about seals and opens Hyper’s small data editor. They make a `seals` array with fields such as name, image, species, and description. They design one semantic seal card, connect its fields to the array, and place the repeated cards in a wrapping flex layout.

Changing the card’s border radius, spacing, or typography updates every instance. Adding another seal to the data editor adds another rendered card. The saved project contains the card template, readable data, normal HTML/CSS, and the minimal data-rendering JavaScript required to open it directly in a browser.

#### Journey 3: Reuse a visual language, then hand it to AI

A designer creates reusable light-DOM components such as a navigation bar, feature card, button group, and footer. They define CSS variables for colors, spacing, typography, and radii at the page, section, or component level, then reuse those components across the design.

The designer can explore freely without writing JavaScript. **Prepare for AI** updates the design summary and checks the handoff folder. The AI receives real HTML/CSS/JavaScript, component descriptions, design variables, responsive rules, and assets—enough to implement the product without translating a canvas or guessing visual intent.

---

## 4. Experience principles

1. **What you see is what ships.** Full-screen background = the webpage at 1:1.
2. **Feel simple; be deep.** Few primary surfaces; rich controls when an element is selected.
3. **Don’t pollute the document.** Selection, outlines, and editor UI live in a separate layer.
4. **Semantic first.** Tags, roles, names, and hierarchy matter more than decorative class soup.
5. **AI-readable by default.** Saved form optimized for both browsers and language models.
6. **Fast local loop.** Localhost server; autosave into the repo; no heavy “publish” ritual for draft work.
7. **States are first-class.** Hidden / alternate UI is design, not an afterthought.

---

## 5. Core UI surfaces (MVP shape)

Keep the product to a small set of always-present tools:

### 5.1 Stage (the page)

- The webpage fills the workspace (or sits in a **device frame** — see §8).
- Click to pick elements.
- Edit visible text directly on the stage, with a clear text-editing mode so normal selection remains predictable.
- Hover / selection feedback comes from an **overlay layer**, not from mutating the user’s HTML (no permanent editor classes on nodes).

### 5.2 Outliner

- Tree of **tags only** (and maybe short name/id badges).
- No full text dump in the tree; **text content on hover** (or a detail peek).
- Click a node → select on stage; stage selection → highlight in outliner.
- The outliner is the primary place for structural editing: insert, move, reparent, reorder, duplicate, and delete nodes.
- Drag and drop in the outliner shows the exact parent and insertion position before applying a change.
- Must handle elements that are **display:none / visibility / off-canvas / state-hidden** — still list them, mark them as inactive/hidden, and offer “reveal in state” / “jump to where it would be.”

### 5.3 Inspector (element settings)

- Controls for whatever the selected element can meaningfully expose.
- HTML is huge; we will **not** expose every CSS property on day one.
- Start with a curated, designer-friendly subset, organized by intent (layout, type, color, spacing, visibility, semantics), then expand.
- A style-context control chooses whether an edit applies to the base design, a breakpoint, an interactive state, or only this element.
- A project breakpoint editor manages named responsive contexts and connects them to device-frame previews.
- Custom elements get their own control schemas (attributes, events, and expected light-DOM child regions) when known.

### 5.4 Pick / active layer readout

- Clear indication of **what is selected** and the ancestor chain (breadcrumb).
- Optional “element map” / hit-area overlay: show where elements sit without changing the real DOM styling — useful when things overlap or are transparent.

### 5.5 Core editing operations

Structural edits intentionally change the authoritative HTML; that is the work Hyper exists to do. “Do not pollute the document” means editor-only outlines, handles, and temporary classes must not be saved. It does not mean the HTML tree is immutable.

- **Insert:** Add a semantic element, custom element, or saved component before, after, or inside the selected node.
- **Text editing:** Edit text on the stage; use the inspector for text that is hidden or otherwise difficult to reach.
- **Move / reparent / reorder:** Primarily drag nodes in the outliner. Optional stage drag and drop may be added later only if it remains precise.
- **Duplicate / delete:** Available from the outliner, context menu, and keyboard shortcuts, with an immediate undo path.
- **Clipboard:** Cut, copy, and paste complete HTML subtrees, including their relevant styles and editor identity handling. Plain text pastes as text, not markup, unless the user explicitly chooses HTML paste.
- **Undo / redo:** Every document-changing command participates in one history across the stage, outliner, and inspector. Autosave does not clear history.
- **Keyboard control:** Arrow through the tree, expand/collapse, move/reorder with modifiers, rename/edit, duplicate, delete, copy/paste, undo/redo, and escape back to selection mode.
- **Drag and drop:** Show a non-document preview marker, validate the target, then perform one undoable HTML-tree operation on drop.

Hyper must prevent or warn about invalid HTML relationships—for example, putting a `<div>` inside a `<p>`—and explain why a drop target is unavailable. It must never silently add wrapper elements or rewrite unrelated markup.

#### MVP command and property policy

The command model stays small and grows from real design workflows rather than attempting every HTML and CSS feature immediately.

- MVP HTML: insert, select, edit text, move/reparent/reorder, duplicate, delete, undo/redo, and edit common semantic attributes.
- MVP CSS: display, flex direction/wrap/alignment, gap, width/height constraints, margin, padding, background, color, typography, border, border radius, and CSS custom properties.
- CSS variables can be declared on `:root`, a selected section, or a reusable component. The outliner marks nodes that establish a variable scope; descendants use normal CSS inheritance.
- Unsupported HTML and CSS are preserved exactly. A visual control is added only when Hyper can represent it honestly and make it pleasant to use.

### 5.6 Data editor and repeaters

The MVP includes a deliberately small data tool for designing repeated UI:

- Create and edit a named array of flat objects using text, number, boolean, image, and URL fields.
- Turn one selected subtree into a repeat template and bind text, attributes, or media to fields.
- Show the template once in the structural outliner, with generated instances grouped underneath it for selection and preview.
- Edit structure and style on the template so every instance updates; edit content in the data editor.
- Save data in a readable project file and use a tiny transparent data runtime to render the native `<template>` in a browser.

This is not a database, CMS, formula language, or general application-state system. Nested relational data, filtering, sorting, pagination, and remote APIs come later.

That’s enough for v1: **stage + outliner + inspector + pick feedback + a small data/repeater panel**. Media and reusable components can open as focused panels when needed.

---

## 6. Document model (the hard product decision)

Hyper must save something that:

1. Opens in a normal browser.
2. Diffs cleanly in git.
3. Is excellent context for AI design work.

### 6.1 Source of truth: HTML and CSS

The web source files are the authoritative design:

- Clean HTML.
- Readable CSS, either in a linked stylesheet or a `<style>` block.
- Readable JSON data when a page uses a repeater.
- Minimal, readable JavaScript only when data rendering or a later interaction requires it.
- No editor chrome, no `__hyper-selected` classes left behind.
- A human or AI may edit these files directly. Hyper must load those edits rather than overwrite them from another model.

Hyper edits these source files through an in-memory authoring model and renders them in the stage. The model is an editing representation of the authoritative files, not a hidden persisted format or an alternative source of truth.

**Optional `design.json` (editor-only metadata)**

- May store workspace state that has no runtime meaning: named preview states, device presets, panel state, selection history, and editor annotations.
- Must never contain required structure, styling, content, or runtime behavior.
- Must be safe to delete: the HTML/CSS/JS page still works and can still be opened in Hyper.
- Is not required by a browser and is not the design source of truth.

### 6.2 Styling strategy

Readable CSS is the default. Inline styles are not Hyper’s primary authoring format because they represent responsive rules, pseudo-classes such as `:hover`, shared styles, inheritance, and reuse poorly.

- Prefer readable CSS rules, semantic selectors, and CSS custom properties for reusable design tokens.
- Preserve existing inline styles when importing HTML, but write new inspector changes to CSS rules by default.
- Allow an explicit inline-style escape hatch only for genuinely one-off values.
- Preserve responsive rules, pseudo-classes, inheritance, and the cascade rather than flattening styles onto elements.
- Hyper’s inspector writes to the authoritative CSS and shows which rule, breakpoint, or state supplies the active value.
- Class names and custom properties should communicate intent; Hyper may suggest names but must not replace them with opaque generated identifiers.

#### Responsive style contexts and cascade

Breakpoints are project settings, not design tokens. A token supplies a reusable value such as a color or spacing size; a breakpoint selects the viewport condition under which CSS applies.

Hyper presents four authoring contexts:

1. **Base:** Rules that apply at every viewport unless overridden.
2. **Breakpoint:** Rules inside a named media query, such as `Tablet · min-width: 768px`.
3. **State:** Rules for a pseudo-class or explicit state selector, such as `:hover`, `:focus-visible`, `[aria-expanded=\"true\"]`, or `[data-state=\"open\"]`.
4. **Local override:** A narrowly targeted CSS rule for the selected element. It remains normal CSS rather than becoming an inline style.

The inspector must not pretend this simple list replaces the real CSS cascade. For every property it shows:

- The computed value currently rendered by the browser.
- Which selector and source file supplied it.
- The active context and media condition.
- Whether the declaration is overridden by specificity, source order, inheritance, a cascade layer, or `!important`.

The breakpoint editor allows create, rename, reorder, edit, and delete. Each breakpoint has a human-readable name and a real media condition. New projects default to a small mobile-first set, while imported documents expose their existing media queries instead of rewriting them. Selecting a breakpoint resizes the iframe to a representative width but does not change the saved CSS until the user edits a property.

Property controls distinguish these actions:

- **Clear override:** Remove the declaration from the current context and reveal the value from the next applicable rule.
- **Set CSS-wide value:** Explicitly write `inherit`, `initial`, `unset`, `revert`, or `revert-layer`.
- **Go to source:** Open the exact CSS rule responsible for the value.

Hyper should keep its own generated rule ordering deterministic, but it must preserve and accurately explain authored or imported cascade behavior rather than silently rearranging CSS.

#### Style scope in the outliner

The outliner is also the map for deciding where a style begins:

- **Page scope:** CSS variables or rules rooted at `:root`.
- **Section scope:** Variables declared on a selected semantic section naturally inherit into its descendants.
- **Component scope:** Rules target the reusable custom-element tag or component class and affect every instance.
- **Element scope:** A stable selector targets only the selected element.

Nodes with scoped variables or component rules receive a small style marker. Selecting the marker shows what the node declares, what it inherits, and which descendants are affected. Hyper still writes normal selectors and CSS custom properties; the outliner is a visual explanation of the web cascade, not a replacement for it.

The product goal is clear: **structure in HTML, presentation in CSS, behavior in small readable JavaScript, and editor-only context in optional metadata.**

### 6.3 Identity

Every editable node needs a **stable id** Hyper can track across reloads (data attribute or reserved id scheme). Without this, outliner ↔ stage ↔ inspector sync and AI “change that button” workflows fall apart.

### 6.4 Authoring model and iframe projection

The live DOM inside the iframe is a rendered projection, never the source Hyper saves. Browsers normalize parsed HTML, scripts mutate nodes at runtime, and custom elements can construct internal DOM that does not exist in the source file. Serializing that DOM back to disk would silently rewrite or invent markup.

- Parse the authoritative HTML and CSS into an in-memory, source-aware authoring model.
- Preserve source details that do not affect rendering but matter to humans and git: doctype, comments, meaningful whitespace, attribute order, and unsupported markup.
- Apply every outliner, stage, and inspector command to that model.
- Write the resulting change back to the authoritative source files, then update or reload the iframe projection.
- Map rendered elements back to authoring nodes using stable identity.
- Observe runtime DOM mutations only to keep selection overlays accurate; do not autosave those mutations.
- Hyper documents never use Shadow DOM. Custom-element content remains ordinary light DOM in the authoring model and iframe.

This separation lets the stage behave like the real webpage without allowing runtime JavaScript or browser normalization to corrupt the authored HTML.

---

## 7. Selection, overlays, and “don’t touch the HTML”

### 7.1 Overlay layer

Editor chrome (boxes, labels, guides) should live **outside** the document’s style cascade:

- Prefer an overlay drawn from measured `getBoundingClientRect()` (and scroll) of nodes in the page document.
- Or a sibling layer in the host UI that mirrors geometry.
- Recompute on resize, scroll, mutation, font load, and state change.

This keeps the published HTML pristine.

### 7.2 Hit testing & pick

- Click through the stage to select the topmost meaningful element.
- Modifier or UI mode to pick parent / child / locked layers.
- Transparent / empty / overlapping nodes need a way to select via outliner when the stage is awkward.

### 7.3 States

States (e.g. empty, loading, open menu, mobile nav, error) can hide or swap UI.

- Prefer native HTML state where it fits: `<details open>`, `<dialog>`, the Popover API, `:checked`, `:disabled`, `:focus-visible`, and standard form behavior.
- Use semantic attributes for meaningful UI state: `hidden`, `aria-expanded`, `aria-selected`, `aria-pressed`, and `aria-hidden`.
- Use a readable `data-state` attribute for application-specific states such as `loading`, `empty`, `error`, or `success`.
- Use classes for styling, not as the only record of semantic state.
- Author named preview states on the document or on regions. A preview state temporarily applies native or semantic attributes inside the iframe without changing the saved default state.
- Outliner shows nodes that exist but are inactive in the current state.
- Overlay can still locate “where this would be” when useful (ghost outline), or jump to the state where it’s visible.
- The authoritative HTML and CSS encode available/default states; Hyper’s interaction runtime performs transitions between them.
- Optional editor metadata may remember named preview combinations and which one Hyper is currently showing, but the page must not require that metadata at runtime.

---

## 8. Viewport & device frames (`vh` / `vw` correctness)

**Requirement:** Design at phone / tablet / desktop widths **and** have viewport units (`vh`, `vw`, `dvh`, media queries) behave like a real browser for that size.

### 8.1 Technical reality

In an **iframe**, `vh`/`vw` and width media queries are relative to the **iframe’s viewport**, not the outer window. That is a feature for Hyper: size the frame to 390×844 and the page inside behaves like that device.

### 8.2 Product approach

- Default: **full-bleed 1:1** with the available stage (desktop workspace).
- Device mode: page lives in a **frame** with fixed CSS width/height (presets + custom).
- The frame _is_ the layout viewport for the document — so `100vh` = frame height. No fake CSS rewriting required for the common case.
- Avoid “auto-grow iframe to content height” while editing with `vh` — that creates feedback loops (known CMS/editor footgun). Device frames should have an explicit height.

Optional later: device chrome (notch, safe areas), `dvh` testing, and DPR simulation. Not required for MVP.

---

## 9. Custom elements & interactions

### 9.1 Custom elements

HTML’s complexity is partly managed by **composition**:

- Hyper can ship a small set of helpful custom elements.
- Hyper-authored custom elements use light DOM only and must never call `attachShadow()`.
- Their meaningful content remains explicit child HTML so the outliner, inspector, CSS, accessibility tools, and AI can inspect it.
- Components style themselves through normal CSS scoped under their custom-element tag, with CSS custom properties for intentional customization.
- Components communicate through bubbling custom events and reflected HTML attributes.
- The inspector reads manifest-defined attributes, events, and expected child structure.
- Users may import trusted custom elements only when they follow the same light-DOM contract. Shadow-DOM components are reported as unsupported rather than treated as mysterious atomic design nodes.

The no-Shadow-DOM rule applies to every page Hyper designs and exports. Editor chrome is outside the authored page, but should follow the same light-DOM approach unless a future technical constraint is explicitly documented. Custom elements are how components stay **visible, inspectable HTML**, not opaque framework or Shadow DOM islands.

### 9.2 Interactions (later scope)

JavaScript interaction authoring is not required for MVP. When introduced, Hyper remains a design tool rather than becoming a JavaScript IDE. Users compose interactions from a focused built-in library through an interaction inspector; writing arbitrary JavaScript is not part of the planned visual workflow.

#### Native behavior first

Use browser behavior without JavaScript whenever possible:

- Links and navigation use `<a>`.
- Disclosure uses `<details>` / `<summary>`.
- Modals use `<dialog>`.
- Popovers use `popover` and `popovertarget`.
- Forms use native controls, validation, and submission.

#### Hyper interaction runtime

When native HTML is insufficient, a small versioned `hyper-runtime.js` uses event delegation to execute readable declarations stored in HTML. The interaction inspector presents **trigger → action → target** rather than exposing code.

Initial triggers:

- Click
- Change
- Submit
- Page ready

Initial actions:

- Show, hide, or toggle an element.
- Set, remove, or toggle an attribute.
- Set a `data-state` value.
- Open or close a dialog or popover.
- Select a tab while synchronizing ARIA attributes.
- Navigate to a URL or page anchor.

A declaration should remain understandable without opening generated code:

```html
<button type="button" aria-controls="site-menu" aria-expanded="false" data-hyper-action="toggle" data-hyper-target="#site-menu">Menu</button>
<nav id="site-menu" hidden>...</nav>
```

The runtime owns coupled accessibility updates—for example, toggling `hidden` on the target and `aria-expanded` on the trigger together. Hyper validates missing targets, invalid actions, and incompatible element roles.

The declarative attributes and the runtime file are part of the authoritative browser source. `design.json` may store editor presentation only. Hyper may either copy the small runtime beside the page or inline it for a single-file export; it must not generate opaque per-element JavaScript.

Imported or hand-written scripts are outside v1 authoring. Hyper preserves them but disables them in the editing iframe by default; a separate trusted preview may run them. This avoids runtime mutations corrupting the authoring model and keeps the common design workflow safe.

Animation / motion: **explicitly later**. Reserve the model so transitions can attach to state changes without rewriting v1.

---

## 10. Media

- Upload images into a **media gallery** stored in the project/repo.
- Reference from HTML in normal ways (`img`, `picture`, CSS backgrounds as needed).
- Keep filenames and optional sidecar metadata (alt text, purpose) **semantic** so AI knows what an asset is for.
- No opaque binary blobs inside the HTML file.

---

## 11. Autosave & repo workflow

- A local npm package or command hosts Hyper and serves the project on localhost.
- A Hyper design lives directly in the repo’s configured `design-specs/` folder; this avoids a working copy and an AI copy drifting apart.
- Edits autosave into the repo working tree after a short debounce.
- **Prepare for AI** flushes pending edits, validates the design, and updates an AI-readable `design.md`. It does not compile the project into an opaque format.
- Artifacts use stable formatting, minimal churn, relative paths, and normal web files.
- Opening `index.html` through any ordinary local static server works without the Hyper editor.

### 11.1 Project/file format

Example MVP project:

```text
design-specs/
  seal-homepage/
    index.html
    styles.css
    data-runtime.js
    design.md
    data/
      seals.json
    media/
      harbor-seal.webp
      grey-seal.webp
    design.json
```

- `index.html` — authoritative semantic structure and native `<template>` elements.
- `styles.css` — authoritative layout, responsive rules, component styles, and CSS variables.
- `data-runtime.js` — small readable runtime used only for data repeaters; omitted when unused.
- `data/*.json` — designer-edited arrays used by repeaters.
- `media/` — repo-local assets with semantic filenames.
- `design.md` — generated file map plus designer-authored intent, component descriptions, responsive notes, and a summary of CSS variables. It helps AI but never overrides the web source.
- `design.json` — optional Hyper-only workspace metadata. The browser output must work if it is deleted.

Future interaction behavior may add `interactions.js`; MVP does not require it. The target command-line experience is equivalent to `npx hyper design-specs/seal-homepage`, with final package naming decided later.

### 11.2 Failure and conflict behavior

Hyper protects source files before convenience:

- Save each changed file atomically by writing a temporary sibling and renaming it only after the complete write succeeds.
- Track the last-read content hash. Never overwrite a file that changed on disk since Hyper read it.
- If an AI or human changes a file and Hyper has no pending edit, reload it automatically while preserving selection where possible.
- If disk and Hyper changed different parts, apply a three-way merge and show the merged result as one undoable external-change transaction.
- If changes overlap, pause autosave for that file and show a focused choice: keep disk, keep Hyper, or save Hyper’s version as a recovery copy. Never choose silently.
- Reject invalid structural operations before changing the authoring model.
- If externally edited HTML or CSS cannot be parsed safely, preserve the exact file, keep the last valid preview, show the source location of the error, and wait for repair.
- A failed **Prepare for AI** leaves the last valid handoff untouched and reports exactly which file or requirement failed.

---

## 12. Simplifying HTML without lying about it

HTML has many elements. Product stance:

1. **Outliner shows all real tags** in the document (no fake “only boxes” model).
2. **Authoring palette** starts simplified: landmarks, text, media, lists, forms, buttons, generic `div`/`span` when needed, plus custom elements.
3. Advanced / rare tags remain insertable and editable, but aren’t dumped into the primary “add” menu.
4. Prefer **correct semantics** (`button` vs clickable `div`, headings in order, labels on inputs). Soft guidance > hard blocks at first.

---

## 13. Technology direction (research summary)

This is planning guidance, not a locked stack.

### 13.1 Runtime shape

| Piece             | Likely approach                                         | Why                                                                 |
| ----------------- | ------------------------------------------------------- | ------------------------------------------------------------------- |
| Editor host UI    | Local web app (vanilla or light tooling)                | Fast iteration; aligns with “real HTML” culture                     |
| Authoring model   | Source-aware in-memory HTML/CSS representation          | Safe commands and minimal source-file changes                       |
| Page document     | Isolated **iframe** rendered from the authoring model   | Correct browser rendering without treating live DOM as saved source |
| Selection overlay | Geometry overlay driven by iframe DOM measurements      | Doesn’t pollute saved HTML                                          |
| Persistence       | Filesystem via local server API                         | Autosave to repo                                                    |
| Custom elements   | Native CE + optional Custom Elements Manifest           | Real HTML; AI/tooling schemas exist today                           |
| Data repeaters    | Native `<template>` + readable JSON + small runtime     | Design one item and render a browser-working list                   |
| Interactions      | Readable HTML attributes and small JavaScript listeners | Runtime behavior works without Hyper                                |

### 13.2 Why iframe (not contenteditable on the host)

- Isolates page CSS from editor chrome.
- Device viewport sizing maps cleanly to nested browsing context.
- Keeps the mutable runtime DOM separate from the source-aware authoring model.
- Matches how serious HTML page editors achieve fidelity.

### 13.3 Adjacent ecosystem (learn from, don’t copy)

- **iframe-based page editors** (e.g. Neiki-style) — fidelity + isolation.
- **Custom Elements Manifest + MCP** — proven path for AI to understand component APIs.
- **CMS page editors** — cautionary tales on `vh` + auto-height iframes.

### 13.4 What Hyper is _not_ technologically

- Not a React/Vue page builder that “exports” HTML as a side effect.
- Not a Figma plugin that approximates CSS.
- Not a rich-text `contenteditable` document pretending to be a website.

---

## 14. Open questions (resolve before / during early spikes)

1. **Imported CSS:** how Hyper chooses an edit target when an existing page has several stylesheets and `<style>` blocks.
2. **Inspector values:** exact visual controls and unit handling for the agreed MVP CSS properties.
3. **Repeater binding syntax:** exact readable convention for binding `<template>` content and attributes to JSON fields.
4. **Multi-page** projects vs single document first.
5. **Collaboration** — out of scope initially; design file format should not block it later.
6. **Security** of running imported user JS in the iframe (sandbox flags vs trusted preview).

---

## 15. Suggested start (spikes, not product build)

Order matters: prove the hard illusions first.

| #   | Spike                                                               | Proves               |
| --- | ------------------------------------------------------------------- | -------------------- |
| 1   | iframe stage + overlay selection that does **not** mutate saved DOM | Clean HTML + pick UX |
| 2   | Device frame presets with `vh`/`media query` demo page              | Viewport truth       |
| 3   | Outliner ↔ selection sync including `display:none` nodes            | States / hidden UX   |
| 4   | Autosave authoritative HTML/CSS and reload external edits           | Repo + AI loop       |
| 5   | Minimal inspector for layout/spacing/color on selected node         | Designer controls    |
| 6   | Data editor + one seal-card template rendered from JSON             | Repeater workflow    |
| 7   | Prepare for AI → validate and update `design.md`                    | AI handoff           |

Only after these feel right: broaden the HTML palette, deepen the inspector, expand states, polish AI-oriented export conventions.

---

## 16. MVP versus later work

### 16.1 MVP requirements

- Run locally against one design folder in a repo.
- Add and structurally edit common HTML elements from the outliner.
- Edit visible text and common semantic attributes.
- Control basic box, flex, spacing, color, typography, border, and radius CSS.
- Create and override CSS variables at page, section, component, or element scope.
- Create a simple responsive breakpoint and edit its overrides.
- Upload/select repo-local images.
- Create one flat data array, one repeat template, and a flex-based repeated list.
- Autosave readable HTML/CSS/data and safely reload external AI edits.
- Prepare the folder for AI with validation and an updated `design.md`.

The first usable slice may implement these controls incrementally, but it is not the MVP until the complete journey—from adding a section to handing the seal design to AI—works.

### 16.2 Later work

- Broader HTML and CSS control coverage.
- Full reusable component library and cross-page component updates.
- Interaction inspector and `hyper-runtime.js`.
- Named application states and richer state previews.
- Advanced Chromium device/capability emulation.
- Animation and transition authoring.
- Nested or remote data, filtering, sorting, and pagination.
- Multi-page navigation and site-wide design management.

### 16.3 Non-goals for now

- Full timeline / motion design suite
- Component marketplace
- Pixel-perfect comparison to Figma files
- Hosted multiplayer editing
- Replacing a code IDE
- Supporting every CSS property and every HTML quirk in the UI

---

## 17. Testable MVP acceptance criteria

1. Starting Hyper with a repo design path opens the editor on localhost and creates or loads that folder without touching unrelated repo files.
2. A user can insert a `<section>`, heading, paragraph, image, and card container; edit text; reorder the nodes in the outliner; undo; and redo.
3. A user can set a page background, create a wrapping flex list, adjust gap/padding, and apply a card border radius entirely through visual controls.
4. A user can create a CSS variable at `:root`, override it on the selected section, and see both declarations and their inheritance represented in `styles.css` and the outliner.
5. A user can add one breakpoint, resize the iframe to it, set a breakpoint-specific property, clear that override, and see the base value return.
6. A user can create a `seals` array with at least three records, bind one seal-card template, and see exactly three cards. Editing the template updates all cards; adding a record adds one.
7. After autosave, the project contains readable `index.html`, `styles.css`, seal data, required media, and the transparent data runtime. A normal local static server renders the same page without Hyper.
8. **Prepare for AI** validates the folder and updates `design.md` with the page purpose, file map, component/repeater descriptions, breakpoint summary, and CSS-variable summary.
9. An external non-conflicting edit to HTML or CSS reloads without data loss. An overlapping edit pauses autosave and requires an explicit conflict choice.
10. Deleting optional `design.json` does not change the browser result or remove information required by an AI to understand the design.

---

## 18. North star

> Hyper is the place you design the website itself — in the browser, as HTML — so that what you save is already the best possible design brief for a human or an AI: semantic structure, clear style intent, honest states, and just enough interaction.
