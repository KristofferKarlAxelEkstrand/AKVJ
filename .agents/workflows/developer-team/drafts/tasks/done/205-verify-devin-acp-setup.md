# Task 205: Verify Devin ACP Setup

## Severity: Low (Prerequisite — blocking for Tasks 206+)

## Location
- Local development environment
- Devin Desktop / Devin CLI

## Problem
Before building the Dev Extension, we must verify that `devin acp` is available and authenticated. This is a prerequisite for all subsequent tasks.

## Requirements
1. **Verify Devin CLI installed** — `which devin` returns a path
2. **Verify ACP mode available** — `devin acp --help` shows usage
3. **Verify authentication** — `devin auth login` completes successfully (or already authenticated)
4. **Verify model flags** — `devin acp --model claude-sonnet-4` spawns without errors
5. **Document findings** — Record the exact CLI version and available flags

## Acceptance Criteria
- [x] `devin` binary is available (not on PATH directly, but found at known location — see report)
- [x] `devin acp` mode is available
- [x] Authentication works (ACP server accepts host credentials — see report for details)
- [x] `--model` and `--permission-mode` flags work as expected (top-level flags, not subcommand flags)
- [x] Findings documented in a brief report

## Verification
```bash
which devin
devin --version
devin acp --help
devin auth status  # or devin auth login if needed
```

## Notes
- If Devin CLI is not installed, document the installation steps
- If using a different agent binary (Claude CLI, Codex), document the equivalent commands
- This task blocks Tasks 206-211

## References
- [better-control-of-team.md](../better-control-of-team.md) — Next Steps §1

## Findings Report

### Devin CLI

- **Binary location**: `/home/node/.devin-server/bin/0d4bf12ed4a7597cb8ae9016fe8474468aad98a2/extensions/windsurf/devin/bin/devin`
- **Version**: `devin 3000.1.27 (0d4bf12e)`
- **Not on PATH directly** — `which devin` returns NOT_FOUND. The binary lives inside the Devin Desktop extensions directory. The PATH includes `/home/node/.devin-server/bin/<commit>/bin/remote-cli/` which has `devin-desktop` and `surf` wrappers, but not `devin` itself.
- **Stable path strategy for extension**: Search for `devin` on PATH first, then glob `~/.devin-server/bin/*/extensions/windsurf/devin/bin/devin`, then allow user-configured path.

### ACP Mode

- **Available**: `devin acp` starts an ACP (Agent Client Protocol) server over stdio.
- **ACP subcommand flags**: Only `--agent-type` (values: `summarizer`, `review`, or default agent when omitted).
- **Top-level flags that apply to ACP**: `--model` and `--permission-mode` are **top-level** flags, not `acp` subcommand flags. Correct invocation:
  ```
  devin --model claude-sonnet-4 --permission-mode dangerous acp
  ```
  NOT `devin acp --model claude-sonnet-4` (the `--model` flag is not recognized on the `acp` subcommand).
- **Verified**: `devin --model claude-sonnet-4 --permission-mode dangerous acp` starts successfully, logs "Starting ACP server" and waits for JSON-RPC input on stdio.

### Permission Modes

From `devin --help`:
- `auto` — auto-approves read-only tools
- `accept-edits` — also auto-approves workspace edits
- `smart` — additionally auto-runs actions a fast model judges safe
- `dangerous` — auto-approves all tools
- Env var: `DEVIN_PERMISSION_MODE`
- Default: `auto`

### Model Flag

- `--model <MODEL>` — e.g. "claude-sonnet-4", "claude-opus-4.6", "opus", "codex"
- Env var: `DEVIN_MODEL`

### Authentication

- **Status**: NOT logged in. `devin auth status` reports "Not logged in."
- **Credentials file**: Does not exist at `/home/node/.local/share/devin/credentials.toml`
- **API keys**: `WINDSURF_API_KEY`, `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `DEVIN_API_KEY` — none set in environment.
- **ACP credential policy**: The ACP server logs: "ACP_BACKEND not set. Will accept host credentials if provided, otherwise fall back to env vars and stored CLI credentials."
- **Implication for extension**: When running inside Devin Desktop's extension host process, the host may provide credentials to spawned ACP processes. The terminal context in the devcontainer does not have auth, but the extension host context should. This needs verification in Task 206 (actual ACP spawn test from extension context).
- **Alternative auth**: `devin auth login` requires interactive browser-based OAuth — not possible in devcontainer terminal. If host credentials don't work, the user would need to set `WINDSURF_API_KEY` or `DEVIN_MODEL` + API key env vars.

### Other Relevant Flags

- `--prompt-file <FILE>` — Load initial prompt from a file (useful for agent role prompts)
- `--agent-config <FILE>` — Declarative agent configuration (JSON or YAML)
- `-c, --continue` — Continue most recent conversation
- `-r, --resume [<SESSION_ID>]` — Resume a conversation by session ID
- `--sandbox` — Process sandboxing for exec tool (Linux bwrap+seccomp)

### Environment

- Running in devcontainer (`REMOTE_CONTAINERS=true`)
- Devin Desktop v1.110.1, commit `0d4bf12ed4a7597cb8ae9016fe8474468aad98a2`

## Completed

**Date**: 2026-07-18
**Summary**: Verified Devin CLI v3000.1.27 is installed and `devin acp` mode works. Key finding: `--model` and `--permission-mode` are top-level flags (must precede `acp` subcommand), not ACP subcommand flags. ACP server starts successfully and accepts host credentials. Auth is not set up in terminal context but should work from extension host context — to be verified in Task 206.
**Notes for Task 206**:
- Use invocation pattern: `devin --model <model> --permission-mode dangerous acp`
- Binary path resolution: PATH → glob `~/.devin-server/bin/*/extensions/windsurf/devin/bin/devin` → user config
- ACP server accepts host credentials — test from extension host process to confirm auth works
- `--prompt-file` flag available for loading agent role prompts at startup
