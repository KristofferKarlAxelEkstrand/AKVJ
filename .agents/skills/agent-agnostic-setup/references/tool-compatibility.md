# Tool Compatibility Matrix

Complete reference for AI coding tool configuration paths, formats, and quirks.

## Tool Overview

| Tool | Reads AGENTS.md | Native file | Skills directory | MCP config |
|------|----------------|-------------|-----------------|------------|
| OpenAI Codex | Yes (primary) | — | `.agents/skills/` | `.codex/config.toml` |
| Claude Code | Yes (fallback) | `CLAUDE.md` | `.claude/skills/` | `.mcp.json` |
| Cursor | Yes | `.cursor/rules/*.mdc` | `.cursor/skills/` | `.cursor/mcp.json` |
| GitHub Copilot | Yes | `.github/copilot-instructions.md` | `.github/instructions/` | `.vscode/mcp.json` |
| Windsurf | Yes | — | `.windsurf/` | — |
| Gemini CLI | Yes (via config) | `GEMINI.md` | — | — |
| Aider | Yes (via config) | `CONVENTIONS.md` | — | `.aider.conf.yml` |
| Devin | Yes | — | — | — |
| Zed | Yes | — | — | — |
| Warp | Yes | — | — | — |
| Goose | Yes | — | — | — |
| OpenCode | Yes | `CLAUDE.md` (legacy) | — | — |
| Roo Code | Yes | — | — | — |
| Amp | Yes | — | — | — |
| Factory | Yes | — | — | — |
| Junie (JetBrains) | Yes | — | — | — |
| UiPath | Yes | — | — | — |

## Detailed Tool Configuration

### OpenAI Codex

- **AGENTS.md**: Primary format. Reads from `~/.codex/AGENTS.md` (global) and repo root (project).
- **Hierarchy**: Supports nested `AGENTS.md` files. Nearest file wins.
- **Size limit**: 32 KiB default per file.
- **Overrides**: `AGENTS.override.md` for machine-local overrides.
- **Skills**: Scans `.agents/skills/` natively.
- **MCP**: `.codex/config.toml` (TOML format, `[mcp_servers.<name>]` sections).

### Claude Code

- **AGENTS.md**: Read as fallback when `CLAUDE.md` is absent. If both exist, `CLAUDE.md` takes precedence.
- **Import**: Use `@AGENTS.md` as first line of `CLAUDE.md` to import AGENTS.md content.
- **Hierarchy**: Supports `CLAUDE.md` at global (`~/.claude/CLAUDE.md`), project root, and subdirectory levels.
- **Imports**: `@`-imports with 4-hop max depth.
- **Skills**: Scans `.claude/skills/` and `.agents/skills/`.
- **MCP**: `.mcp.json` at project root (JSON format).
- **Settings**: `.claude/settings.json` (hooks, metadata — Claude-specific, not portable).
- **Local overrides**: `.claude/settings.local.json` (always gitignored).

### Cursor

- **AGENTS.md**: Read natively for project context.
- **Legacy**: `.cursorrules` (deprecated, single-file). Migrate to `.cursor/rules/*.mdc`.
- **Rules**: `.cursor/rules/*.mdc` (MDC format with glob scoping, `alwaysApply` flag). Not portable to other agents.
- **Skills**: Scans `.cursor/skills/` and `.agents/skills/`.
- **MCP**: `.cursor/mcp.json` (JSON format).
- **Note**: MDC format uses frontmatter with `globs` and `alwaysApply` fields — no equivalent in other tools.

### GitHub Copilot

- **AGENTS.md**: Read and merged with `.github/copilot-instructions.md`.
- **Instructions**: `.github/copilot-instructions.md` (primary). Also `.github/instructions/*.instructions.md` for path-specific rules.
- **Skills**: Scans `.github/instructions/` (not SKILL.md format — uses `.instructions.md` format).
- **MCP**: `.vscode/mcp.json` (JSON format).
- **Note**: Copilot does not understand `@`-imports. Use symlinks or content pointer files.

### Gemini CLI

- **AGENTS.md**: Read when configured in `.gemini/settings.json`.
- **Config**: `.gemini/settings.json` with `{ "context": { "fileName": "AGENTS.md" } }`.
- **Native**: `GEMINI.md` (hierarchical, walks up to `.git` root).
- **Skills**: Not currently supported.

### Aider

- **AGENTS.md**: Read when configured in `.aider.conf.yml`.
- **Config**: `.aider.conf.yml` with `read: AGENTS.md`.
- **Native**: `CONVENTIONS.md` (legacy).
- **Skills**: Not currently supported.

### Windsurf

- **AGENTS.md**: Read natively.
- **Skills**: `.windsurf/` directory.
- **Workflows**: `.windsurf/workflows/` or `.devin/workflows/` (slash commands).

## Symlink Strategy

For multi-tool repos, create symlinks from tool-specific directories to the canonical `.agents/` location:

```bash
# Claude Code skills
ln -s ../../.agents/skills/agent-agnostic-setup .claude/skills/agent-agnostic-setup

# Cursor skills
ln -s ../../.agents/skills/agent-agnostic-setup .cursor/skills/agent-agnostic-setup
```

### Windows Caveat

On Windows, git symlinks may check out as plain text files containing the target path string. Mitigations:
- `git config --global core.symlinks true` before cloning
- Use `@`-imports instead (Claude Code, OpenCode)
- Use content pointer files instead of symlinks (Copilot, Cursor)
- Document the requirement in `CONTRIBUTING.md`

## MCP Configuration

MCP configs are not portable — same data, different format per agent. Use a canonical source and sync script.

### Canonical Source: `.agents/mcp/servers.json`

```json
{
  "figma": {
    "type": "http",
    "url": "https://mcp.figma.com/mcp"
  }
}
```

### Per-Agent Generation

| Agent | File | Format |
|-------|------|--------|
| Claude Code | `.mcp.json` | JSON with `mcpServers` key |
| Cursor | `.cursor/mcp.json` | JSON with `mcpServers` key |
| Codex | `.codex/config.toml` | TOML with `[mcp_servers.<name>]` sections |
| Copilot | `.vscode/mcp.json` | JSON with `servers` key |

### Codex Special Case

Codex does not auto-load repo-local `.codex/config.toml`. The sync script should support an `install-codex` command that merges a managed block into `~/.codex/config.toml` with sentinel comments:
```toml
# BEGIN <repo> managed MCP
[mcp_servers.figma]
type = "http"
url = "https://mcp.figma.com/mcp"
# END <repo> managed MCP
```

## Decision Tree

```
Single tool only?
├── Yes → Use that tool's native format
└── No → AGENTS.md as source of truth
    ├── Claude Code in the mix?
    │   └── Create CLAUDE.md with @AGENTS.md import
    ├── Copilot in the mix?
    │   └── Create .github/copilot-instructions.md pointer
    ├── Cursor in the mix?
    │   └── Create .cursor/rules/ shims (MDC format)
    ├── Gemini CLI in the mix?
    │   └── Configure .gemini/settings.json
    └── Aider in the mix?
        └── Configure .aider.conf.yml

Need reusable skills?
└── Create .agents/skills/ + symlink to tool directories

Need MCP?
└── Create .agents/mcp/servers.json + sync script
```
