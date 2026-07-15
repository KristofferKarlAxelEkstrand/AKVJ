---
name: agent-agnostic-setup
description: >-
  Sets up and audits agent-agnostic configuration for any repository.
  Creates AGENTS.md, SKILL.md skills, .agents/ directory structure,
  and symlink bridges to all major AI coding tools (Claude Code, Cursor,
  Copilot, Codex, Gemini CLI, Windsurf, Aider, Devin).
  Use when setting up a new repo for AI agents, migrating from
  tool-specific config files, or auditing existing agent configuration.
  Trigger phrases include "agent agnostic", "AGENTS.md", "SKILL.md",
  "set up AI coding agent", "configure cursor rules", "claude code setup",
  "copilot instructions", "multi-agent config".
---

# Agent-Agnostic Setup

This skill sets up reusable, portable agent configuration that works across 30+ AI coding tools using open standards.

## When to Use This Skill

- **New repo**: Setting up AI agent instructions from scratch
- **Migration**: Consolidating tool-specific files (`.cursorrules`, `CLAUDE.md`, `copilot-instructions.md`) into one source of truth
- **Audit**: Reviewing existing agent config for completeness and portability
- **Adding skills**: Creating reusable SKILL.md capabilities that work across agents

## The Three-Layer Standard

Every piece of agent configuration falls into exactly one of three layers:

| Layer | File Format | Purpose | Portable? |
|-------|------------|---------|-----------|
| **Instructions** | `AGENTS.md` | Project context, always loaded | Yes — read by 30+ agents |
| **Skills** | `SKILL.md` | Reusable on-demand capabilities | Yes — adopted by 25+ agents |
| **MCP** | `servers.json` | External tool access | No — generated per-agent |

**Key principle**: Portable things get symlinks. Generated things get a sync script. Agent-specific things stay in their native directories.

## Setting Up a New Repo

### Step 1: Create AGENTS.md

Create `AGENTS.md` at the repository root. This is the single source of truth — every agent reads it.

**Recommended sections** (in order):
1. **Project overview** — what the project is, language, framework, versions
2. **Quick-start** — steps an agent should take before working
3. **Critical constraints** — performance requirements, architecture rules, things agents must not do
4. **Build and test commands** — exact commands with flags (e.g., `npm run test:visual`, not "run the tests")
5. **Code conventions** — only rules that differ from language defaults
6. **Testing instructions** — how to run the suite, a single test, what to mock
7. **Security/boundaries** — files the agent should never touch, secrets handling
8. **Commit and PR guidelines** — branch naming, commit format, merge strategy

**Best practices**:
- Keep under 32 KiB (Codex default limit)
- Be task-oriented: "how to test", "how to deploy" — not "write clean code"
- Include exact commands with flags, not vague tool names
- Only include rules that differ from language defaults — things the agent would get wrong without guidance
- For monorepos, place sub-`AGENTS.md` files in each package (nearest file wins)

See `references/agents-md-guide.md` for a detailed template and examples.

### Step 2: Create `.agents/` Directory

```
.agents/
├── AGENTS.md              # Self-management doc (see below)
├── skills/                # Shared skills (committed to git)
│   └── <skill-name>/
│       ├── SKILL.md       # Required: metadata + instructions
│       ├── references/    # Optional: detailed docs loaded on demand
│       ├── scripts/       # Optional: executable code
│       └── assets/        # Optional: templates, resources
├── skills-local/          # Private skills (gitignored)
│   └── .gitkeep
├── mcp/                   # Optional: MCP server config
│   └── servers.json       # Canonical source for all agents
└── scripts/
    ├── link-skills.sh     # Symlink skills to agent-native dirs
    └── sync-mcp.sh        # Generate per-agent MCP configs
```

### Step 3: Create Tool Compatibility Bridges

Most agents read `AGENTS.md` natively. For tools that need a separate file, create pointers:

**Claude Code** — `CLAUDE.md` with `@AGENTS.md` import:
```markdown
@AGENTS.md

This repo keeps reusable agent assets in `.agents/` and syncs tool-specific
adapters with `.agents/scripts/`.
```

**GitHub Copilot** — `.github/copilot-instructions.md` as a content pointer:
```markdown
This project's agent instructions live in [AGENTS.md](../AGENTS.md).
Read that file for all project context, conventions, and commands.
```

**Cursor** — `.cursor/rules/main.mdc` as a thin shim or symlink to `AGENTS.md`.

**Gemini CLI** — `.gemini/settings.json`:
```json
{ "context": { "fileName": "AGENTS.md" } }
```

**Aider** — `.aider.conf.yml`:
```yaml
read: AGENTS.md
```

**Windows symlink caveat**: Use `git config --global core.symlinks true` before cloning. If symlinks break, use `@`-imports (Claude Code, OpenCode) or content pointer files instead.

### Step 4: Create Skills (Optional)

Skills are reusable, on-demand capabilities. Unlike AGENTS.md (always loaded), skills activate only when relevant.

1. Create `.agents/skills/<skill-name>/SKILL.md`
2. Run `.agents/scripts/link-skills.sh` to symlink to agent-native directories
3. Commit the skill directory and symlinks

See `references/skill-md-spec.md` for the full SKILL.md specification.

### Step 5: Run and Verify

```bash
# Create symlinks for all agents
.agents/scripts/link-skills.sh

# Verify symlinks resolve
ls -la .claude/skills/
ls -la .cursor/skills/

# Verify AGENTS.md is valid
cat AGENTS.md | head -5
```

## Migrating an Existing Repo

### Audit What You Have

```bash
find . -maxdepth 3 \( \
  -name "AGENTS.md" -o -name "CLAUDE.md" -o \
  -name ".cursorrules" -o -name "SKILL.md" -o \
  -name "copilot-instructions.md" -o -name "CONVENTIONS.md" \
\) -not -path "*/node_modules/*" -not -path "*/.venv/*"
```

### Classification Matrix

| Found | Classify as | Action |
|-------|------------|--------|
| `AGENTS.md` | Portable | Keep as canonical |
| `CLAUDE.md` with full instructions | Portable | Merge into `AGENTS.md`, reduce to `@AGENTS.md` pointer |
| `.cursorrules` | Portable | Merge into `AGENTS.md`, delete (legacy) |
| `.claude/skills/*/SKILL.md` | Portable | `git mv` to `.agents/skills/`, replace with symlink |
| `.cursor/commands/*.md` | Portable | `git mv` to `.agents/skills/` as SKILL.md format |
| `.mcp.json` | Generated | Copy to `.agents/mcp/servers.json`, generate per-agent |
| `.cursor/rules/*.mdc` | Agent-specific | Leave as-is (MDC format not portable) |
| `.claude/settings.json` | Agent-specific | Leave as-is (hooks, Claude-specific) |

### Migration Order

1. **Instructions** (lowest risk): Consolidate into `AGENTS.md`, create pointer files
2. **Skills**: Move to `.agents/skills/`, create symlinks
3. **MCP**: Create canonical `servers.json`, add sync script
4. **Cleanup**: Add `.agents/AGENTS.md`, update `.gitignore`, verify

## `.agents/AGENTS.md` Template

```markdown
# .agents/

Agent-agnostic configuration following the [Agent Skills](https://agentskills.io)
open standard and [AGENTS.md](https://agents.md) conventions.

## Layout

- `skills/` — Shared skills (committed). Each is a directory with `SKILL.md`.
- `skills-local/` — Private skills (gitignored).
- `mcp/servers.json` — Canonical MCP server config (if using MCP).
- `scripts/` — Sync and validation scripts.

## Adding a Skill

1. Create `.agents/skills/<name>/SKILL.md` with `name` + `description` frontmatter
2. Run `.agents/scripts/link-skills.sh`
3. Commit the skill directory and the new symlink

## Rules

- Edit skills in `.agents/skills/`, never in `.claude/skills/` or `.cursor/skills/`
- Edit MCP in `.agents/mcp/servers.json`, never in `.mcp.json` or `.cursor/mcp.json`
```

## Audit Checklist

- [ ] `AGENTS.md` exists at repo root
- [ ] `AGENTS.md` has project overview, build/test commands, code conventions, boundaries
- [ ] `AGENTS.md` is under 32 KiB
- [ ] `CLAUDE.md` uses `@AGENTS.md` import (not duplicate content)
- [ ] `.github/copilot-instructions.md` points to `AGENTS.md` (if Copilot used)
- [ ] `.agents/` directory exists with `AGENTS.md` self-management doc
- [ ] `.agents/skills/` contains project skills with valid `SKILL.md` files
- [ ] `.agents/scripts/link-skills.sh` exists and runs without errors
- [ ] Symlinks in `.claude/skills/` and `.cursor/skills/` resolve correctly
- [ ] `.agents/skills-local/` is in `.gitignore`
- [ ] No duplicate instructions across files (single source of truth)
- [ ] All commands in `AGENTS.md` include exact flags (e.g., `npm run test:visual`)
- [ ] SKILL.md `name` fields match their parent directory names
- [ ] SKILL.md `description` fields include trigger phrases for auto-activation

## References

- [AGENTS.md spec](https://agents.md/) — Linux Foundation open standard
- [Agent Skills spec](https://agentskills.io/specification) — SKILL.md format
- [Agent-Agnostic Repository Guide](https://gist.github.com/davidgibsonp/337be9b80b3f03eccd188235c287bb05) — Practical setup guide
- See `references/agents-md-guide.md` for detailed AGENTS.md writing guide
- See `references/skill-md-spec.md` for full SKILL.md specification
- See `references/tool-compatibility.md` for complete tool matrix
