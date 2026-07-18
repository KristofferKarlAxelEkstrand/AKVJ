# Task 216: Add MCP Server Configuration to AgentConfig

## Severity: Low-Medium (Capability — AKVJ agents can't access MIDI spec without this)

## Location
- `devin-team-controller/src/types/agents.ts` — `AgentConfig` interface
- `devin-team-controller/src/acp/AcpClient.ts` — `newSession()` call (line ~113)
- `devin-team-controller/src/acp/AcpClientPool.ts` — `startAgent()`

## Problem

`session/new` is called with `mcpServers: []` hardcoded:

```typescript
// AcpClient.ts ~line 113
await this.#connection.newSession({ cwd: this.#workspaceRoot, mcpServers: [] });
```

This means no agent has access to MCP servers. Specifically, the `akvj-developer` and `mainframe-developer` agents are working on MIDI-related code without access to the `midi-mcp` MCP server — the MIDI 1.0/2.0 spec knowledge base built specifically for this repo.

The `midi-mcp` server is already built and ships with this repo (`midi-mcp/` workspace). It exposes tools like `search_spec_data`, `read_spec_doc`, `list_spec_docs` that give agents deep MIDI protocol knowledge. Without it being passed in `session/new`, the agents can't use it.

## Requirements

1. **Add `mcpServers` field to `AgentConfig`**:
   ```typescript
   interface AgentConfig {
     // ... existing fields ...
     mcpServers?: McpServerConfig[];
   }

   interface McpServerConfig {
     name: string;
     command: string;
     args: string[];
     env?: Record<string, string>;
   }
   ```

2. **Wire through to `session/new`** in `AcpClient`:
   ```typescript
   async newSession(mcpServers: McpServerConfig[] = []): Promise<string> {
     const result = await this.#connection.newSession({
       cwd: this.#workspaceRoot,
       mcpServers,
     });
     // ...
   }
   ```

3. **Configure `midi-mcp` for AKVJ and Mainframe Developer agents** in `agents.ts`:
   ```typescript
   {
     role: 'akvj-developer',
     // ...
     mcpServers: [{
       name: 'midi-mcp',
       command: 'node',
       args: ['midi-mcp/src/index.js'],
     }],
   }
   ```

4. **Leave other agents with `mcpServers: []`** — Team Lead, QA Reviewer, Overseer, etc. don't need MIDI spec access.

## Acceptance Criteria
- [ ] `AgentConfig` has `mcpServers?: McpServerConfig[]` field
- [ ] `AcpClient.newSession()` passes `mcpServers` through to ACP
- [ ] `akvj-developer` and `mainframe-developer` have `midi-mcp` in their config
- [ ] Other agents have empty `mcpServers` (unchanged behavior)
- [ ] Extension compiles clean
- [ ] Verify `midi-mcp/src/index.js` path is correct relative to workspace root

## Verification
```bash
# Confirm midi-mcp entry point
ls midi-mcp/src/index.js
node midi-mcp/src/index.js  # should start stdio MCP server, wait for input
```

## Notes
- The ACP `mcpServers` shape may differ between Devin CLI versions. Check the `@agentclientprotocol/sdk` types for the exact field names (`command`, `args`, `env`).
- The `midi-mcp` server uses stdio transport (documented in `midi-mcp/README.md`) — this matches what ACP expects.
- If the path needs to be absolute, resolve it relative to `this.#workspaceRoot` in `AcpClient.newSession()`.
- Consider also adding the repo's `midi-mcp` to the `test-marshal` agent if test coverage for MIDI-specific code is being checked.

## References
- [better-control-of-team.md](../better-control-of-team.md) — Open question #6 (MCP servers in session/new)
- `midi-mcp/README.md` — MCP server documentation
- `AGENTS.md` — MIDI Spec MCP Server section
- `devin-team-controller/src/acp/AcpClient.ts` — `newSession()`
- `devin-team-controller/src/types/agents.ts` — `McpServerConfig`, `AgentConfig`

## Completed

**Date**: 2026-07-18
**Changed**:
- `devin-team-controller/src/types/agents.ts` — added `McpServerConfig` interface (`name`, `command`, `args`, optional `env`); added `mcpServers?: McpServerConfig[]` to `AgentConfig`; `akvj-developer` and `mainframe-developer` now have `midi-mcp` (`node midi-mcp/src/index.js`) in their config.
- `devin-team-controller/src/acp/AcpClient.ts` — `newSession(mcpServers: McpServerConfig[] = [])` passes the array through to ACP `session/new`.
- `devin-team-controller/src/acp/AcpClientPool.ts` — `#startFreshAgent()` passes `config.mcpServers ?? []` to `client.newSession()`.
**Note**: ACP `mcpServers` shape should be verified against live Devin CLI once running; field names (`command`, `args`) match the plan but the actual spec may differ slightly.
