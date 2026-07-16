# SKILL.md Specification

Complete reference for the SKILL.md format, based on the [Agent Skills specification](https://agentskills.io/specification).

## Directory Structure

A skill is a directory containing, at minimum, a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: metadata + instructions
├── scripts/          # Optional: executable code
├── references/       # Optional: documentation loaded on demand
├── assets/           # Optional: templates, resources
└── ...               # Any additional files or directories
```

The directory name **must** match the `name` field in the frontmatter.

## SKILL.md Format

The file has two parts: YAML frontmatter between `---` delimiters, and a markdown body after.

### Minimal Example

```markdown
---
name: skill-name
description: A description of what this skill does and when to use it.
---

# Skill Name

Instructions for the agent...
```

### Full Example

```markdown
---
name: pdf-processing
description: >-
  Extracts text and tables from PDF files, fills PDF forms, and merges
  multiple PDFs. Use when working with PDF documents or when the user
  mentions PDFs, forms, or document extraction.
license: Apache-2.0
compatibility: Requires Python 3.9+ and pdfplumber package
metadata:
  author: example-org
  version: "1.0"
allowed-tools: Bash(python:*) Read Write
---

# PDF Processing

## When to use this skill

Use when the user asks to:
- Extract text from PDF files
- Fill PDF forms
- Merge multiple PDFs

## Instructions

1. Identify the type of PDF operation needed
2. For text extraction, use scripts/extract_text.py
3. For form filling, parse fields first, then validate input

## Edge Cases

- Scanned documents may need OCR — warn the user
- Large files should be processed in chunks
```

## Frontmatter Fields

### Required Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `name` | string | 1-64 chars, lowercase letters/numbers/hyphens only, must not start/end with hyphen, no consecutive hyphens, must match parent directory name |
| `description` | string | 1-1024 chars, non-empty, describes what the skill does AND when to use it |

### Optional Fields

| Field | Type | Constraints |
|-------|------|-------------|
| `license` | string | License name or reference to bundled license file |
| `compatibility` | string | 1-500 chars, environment requirements (product, packages, network) |
| `metadata` | map | Arbitrary key-value pairs (string keys, string values) |
| `allowed-tools` | string | Space-separated pre-approved tools (experimental) |

### Name Field Rules

- Lowercase letters (`a-z`), numbers (`0-9`), and hyphens (`-`) only
- Must not start or end with a hyphen
- Must not contain consecutive hyphens (`--`)
- Must match the parent directory name exactly

**Valid**: `pdf-processing`, `code-review`, `data-analysis-2`
**Invalid**: `PDF-Processing` (uppercase), `-pdf` (starts with hyphen), `pdf--processing` (consecutive hyphens)

### Description Field Best Practices

The description is the most important field — it's how agents decide when to auto-load the skill.

**Good** (specific, includes triggers):
```yaml
description: >-
  Extracts text and tables from PDF files, fills PDF forms, and merges
  multiple PDFs. Use when working with PDF documents or when the user
  mentions PDFs, forms, or document extraction.
```

**Poor** (too vague):
```yaml
description: Helps with PDFs.
```

Use the **Trigger Triad**:
1. **Capability** — the verb and object: what the skill produces
2. **Trigger conditions** — explicit "Use when..." clause
3. **User vocabulary** — literal words/phrases a user is likely to type

### Safety Note

Avoid angle brackets (`<` or `>`) anywhere in the frontmatter — they can inject unintended instructions into the system prompt.

## Body Content

The markdown body contains the skill instructions. Write whatever helps agents perform the task effectively, but follow these strict formatting rules:
- **No Emojis**: Never use emojis in the markdown body.
- **No Fluff**: Keep the documentation as short and sharp as possible.

**Recommended sections**:
- **When to use this skill** — clear criteria for when the skill applies
- **Step-by-step instructions** — explicit, numbered steps
- **Examples** — expected inputs and outputs
- **Common edge cases** — what to watch out for

## Progressive Disclosure

Agents load skills in three tiers, pulling in more detail only as needed:

1. **Metadata** (~100 tokens): `name` + `description` loaded at startup for all skills
2. **Instructions** (<5000 tokens recommended): Full `SKILL.md` body loaded on activation
3. **Resources** (as needed): Files in `scripts/`, `references/`, `assets/` loaded only when referenced

**Keep SKILL.md under 500 lines.** Move detailed reference material to `references/` files and point to them from the main file.

## Optional Directories

### `scripts/`

Executable code agents can run. Scripts should:
- Be self-contained or clearly document dependencies
- Include helpful error messages
- Handle edge cases gracefully

### `references/`

Additional documentation agents read on demand:
- `REFERENCE.md` — detailed technical reference
- Domain-specific files (`api.md`, `error-codes.md`, etc.)

### `assets/`

Static resources:
- Templates (document templates, config templates)
- Sample files
- Configuration examples

## File References

When referencing other files in your skill, use relative paths from the skill root:

```markdown
For complete API documentation, see [references/api.md](references/api.md).
Run the main script: `python scripts/main.py`
```

Keep file references one level deep from `SKILL.md`. Avoid deeply nested reference chains.

## Skill Discovery Locations

Agents scan these paths for skills (project-level overrides user-level):

| Scope | Cross-client path | Client-specific path |
|-------|-------------------|---------------------|
| Project | `.agents/skills/` | `.<client>/skills/` |
| User | `~/.agents/skills/` | `~/.<client>/skills/` |

The `.agents/skills/` convention is the cross-client standard. Skills installed by one compliant client are automatically visible to others.

## Validation

A valid SKILL.md:
- Has YAML frontmatter between `---` delimiters
- Contains required `name` and `description` fields
- `name` matches the parent directory name
- `name` follows naming conventions (lowercase, hyphens, no consecutive hyphens)
- `description` is non-empty and describes both what and when
- Body content is markdown
- Total file is under 500 lines recommended
