---
status: done
stage: done
verification_status: unverified
last_verified_at: unverified
migration_source: legacy-workflow
migration_imported_at: 2026-07-30
---

# Fix ClipEditorController parameter naming

---
status: in-progress
assignee: mainframe-developer
priority: low
---

## Task Description

Fix vague callback parameter name in `mainframe/src/js/ClipEditorController.js`.

## File to Modify

`mainframe/src/js/ClipEditorController.js` - Line 50 (JSDoc for constructor)

## Change Required

**Current:**
```javascript
@param {(statusElement: HTMLElement, message: string, kind?: string) => void} options.setStatus
```

**Proposed:**
```javascript
@param {(statusElement: HTMLElement, message: string, statusClass?: string) => void} options.setStatus
```

## Rationale

Parameter name `kind` is vague — it's actually a CSS class name for status styling (`'is-ok'`, `'is-err'`, etc.). Using `statusClass` matches the pattern established in `main.js` (previously filed nit #100) and makes the parameter's purpose immediately clear to readers.

## Source

[NIT] mainframe/src/js naming sweep (2026-07-19) - filed by Nitpicker
