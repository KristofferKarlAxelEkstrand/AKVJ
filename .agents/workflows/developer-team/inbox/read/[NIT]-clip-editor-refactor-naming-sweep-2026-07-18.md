# [NIT] Clip Editor Refactor — Naming & Terminology Sweep

**Date:** 2026-07-18
**Swept by:** The Nitpicker
**Area:** `mainframe/src/js/` — new files from the clip-editor refactor (`ChoiceItem.js`,
`ChoiceList.js`, `RoleChoice(s).js`, `SortChoice(s).js`, `ClipCategory.js`, `ClipInstance.js`,
`ClipFrame.js`, `ClipFrames.js`, `ClipNameInput.js`, `ClipEditorController.js`,
`ProjectChooser.js`, `SimpleRouter.js`, `clipEditorRoute.js`, `generateClipId.js`,
`acceptedImageFiles.js`, `editorMeta.js`, `syncTiming.js`, `apiClient.js`) plus
`mainframe/src/index.html`.

---

## Nits (naming/pattern, my lane)

### 1. `#abort` naming — now 4 instances of the same imprecise name

- **Files:** `mainframe/src/js/ChoiceItem.js:13`, `mainframe/src/js/ChoiceList.js:17`,
  `mainframe/src/js/ClipNameInput.js:30` (plus the already-known `UserMessage.js` instance in both
  `akvj/` and `mainframe/`, filed previously in
  `[NIT]-new-files-naming-sweep-2025-07-18-2.md`).
- **What:** `#abort = null;` holds an `AbortController` instance, not the abort action itself
  (`this.#abort?.abort()` reads like calling abort on itself).
- **Why confusing:** The field stores a controller; the name reads like a verb/flag. A newcomer
  has to check the type to realize `#abort` *is* the controller, not a boolean or callback.
- **Suggested fix:** Rename to `#abortController` in all three new files (matches the fix already
  proposed for `UserMessage.js`). This pattern has now appeared 4 times — worth a quick
  find-all-replace across the `#abort` field name rather than one-off fixes, since it's clearly the
  house style for this AbortController-per-connectedCallback pattern.

### 2. Custom-element tag prefix is split-brained across `mainframe/src/js/`

- **Files (prefixed `akvj-*`):** `ClipList.js:159` (`akvj-clip-list`), `MappingTable.js:133`
  (`akvj-mapping-table`), `StagingPreview.js:432` (`akvj-staging-preview`).
- **Files (unprefixed, same directory):** `ClipCategory.js:43` (`clip-category`),
  `ClipFrame.js:218` (`clip-frame`), `ClipFrames.js:201` (`clip-frames`), `ClipInstance.js:117`
  (`clip-instance`), `ClipNameInput.js:132` (`clip-name-input`), `PianoKey.js:595` (`piano-key`),
  `PianoRoll.js:419` (`piano-roll`), `ProjectChooser.js:206` (`project-chooser`),
  `RoleChoice.js:24`/`RoleChoices.js:30` (`role-choice`/`role-choices`),
  `SortChoice.js:24`/`SortChoices.js:30` (`sort-choice`/`sort-choices`), `UserMessage.js:91`
  (`user-message`), `UserMessages.js:158` (`user-messages`).
- **Cross-workspace tell:** the *same* widget is tagged differently depending on which app it
  lives in — `akvj/src/js/ui/UserMessage.js:89` defines `akvj-user-message`, while
  `mainframe/src/js/UserMessage.js:91` defines plain `user-message`.
- **Why confusing:** `AGENTS.md`/code-standards call for "one documented tag-prefix rule." Right
  now 3 mainframe tags are prefixed and 13 aren't, with no visible rule distinguishing them (it's
  not "app chrome vs. leaf widget" — `akvj-mapping-table` and `role-choice` are both leaf-ish
  editor widgets). A reader can't predict a tag name from a class name.
- **Suggested fix:** Team Lead/Overseer call on one rule (e.g. "all mainframe custom elements get
  `akvj-*}"` or "no prefix, since mainframe is a single-app context and collisions are unlikely").
  Whichever is chosen, apply it to all 16 tags above for consistency. Flagging as one batched item
  since it's clearly one systemic decision, not 16 individual typos.

### 3. `ClipEditorController.js` — `bind()` is a vague verb for "wire up DOM listeners"

- **File:** `mainframe/src/js/ClipEditorController.js:101`
- **What:** `bind()` has the doc comment `/** Wire DOM listeners once after construction. */` right
  above it, but the method name itself doesn't say what's being bound (event listeners? data?
  `this`?).
- **Why confusing:** This is the same smell class as the `setup()` renames already done elsewhere
  in the codebase (`#initializeVisuals()`, `mount()`, `enable()`, `initialize()`) — a
  one-word lifecycle verb that only makes sense once you've read the JSDoc.
- **Suggested fix:** Rename to `bindEventListeners()` or `wireControls()` to match the doc comment
  and the naming style already adopted for the other lifecycle methods.

### 4. `duration` vs `durationMs` — same concept, two naming styles across one feature

- **Files:** `ClipFrame.js` (`#duration` field, `duration` getter, `setDuration(duration)`, event
  detail key `duration` — lines 13, 42-44, 53, ~99-104), `ClipFrames.js` (`getDurations()`,
  `setAllDurations(ms)`, `areDurationsUniform()`, event detail keys `duration`/`all` — lines 43-45,
  57-64, 74-89) vs. `ClipEditorController.js`, which already does this correctly:
  `#stagedDurationsMs`, `#lastUniformDurationMs` (lines 24, 37).
- **Why confusing:** All of these represent the same milliseconds value (confirmed by
  `ClipFrame.js`'s own aria-label text `Frame N duration (ms)` and `setAllDurations(ms)`'s `ms`
  param name), but only the controller's field names say so. A reader skimming `ClipFrame`/`
  ClipFrames` in isolation has to go hunting for the aria-label or the caller to learn the unit —
  exactly the "units missing from names" case the cheatsheet calls out.
- **Suggested fix:** Rename `ClipFrame#duration`/`duration` getter/`setDuration()` →
  `#durationMs`/`durationMs`/`setDurationMs()`, and `ClipFrames.getDurations()` /
  `setAllDurations()` / `areDurationsUniform()` → `getDurationsMs()` / `setAllDurationsMs()` /
  `areDurationsMsUniform()` (or similar), plus the `durationchange` event detail key
  `duration` → `durationMs`. Matches the convention the controller already uses one layer up.

### 5. `index.html` — `drop-zone` / `staging-preview` break the established `clip-editor-*` id prefix

- **File:** `mainframe/src/index.html:42` (`id="drop-zone"`), `:47` (`id="staging-preview"`)
- **What:** Every other sibling id inside `#panel-clip-editor` follows `clip-editor-*` (e.g.
  `clip-editor-form`, `clip-editor-heading`, `clip-editor-new`, `clip-editor-status` — ~20
  instances), a convention that itself was the fix for a previously-filed nit
  (`upload-*` → `clip-editor-*`, see `[NIT]-mainframe-non-js-sweep-2025-07-18.md`). `drop-zone`
  and `staging-preview` are bare ids sitting in the same panel, breaking that pattern again.
- **Suggested fix:** `drop-zone` → `clip-editor-drop-zone`, `staging-preview` →
  `clip-editor-staging-preview` (update the matching `document.getElementById(...)` calls in
  `ClipEditorController.js:66,73`).

---

## Celebrations

- **`ClipInstance.js`** — `#boundDragStart = this.#handleDragStart.bind(this)` cached at field
  definition, honest event names (`clipedit`/`clipdelete`/`clipmap`), and a `#handleDragStart` that
  genuinely just handles drag-start (bails via `event.preventDefault()` on button clicks) — no
  surprises. Textbook.
- **`SimpleRouter.js`** — clean, well-documented, does exactly what its name says. `currentPath`,
  `#handleRoute`, `#boundHandlePopState` are all honest and unambiguous.
- **`generateClipId.js`** — `slugifyClipName`/`baseIdFromSlug`/`randomAlnum` read like the
  algorithm's own table of contents. No comments needed to understand the flow.
