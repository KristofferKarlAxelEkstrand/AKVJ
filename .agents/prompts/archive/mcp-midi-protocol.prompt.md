# Task: Build the MIDI Protocol MCP Server (Workspace & Extraction)

## Overview
Your goal is to build a Model Context Protocol (MCP) server that provides LLM agents with specialized expertise in the MIDI 1.0 and 2.0 protocols by indexing the massive collection of official specification PDFs and HTML files located in the `.midi-raw-data/` directory.

To ensure performance and separation of concerns, this server must be built as a standalone NPM workspace, and the PDF extraction must be a one-time build step rather than an on-the-fly runtime operation.

## Architecture constraints
- **Language**: Node.js (Vanilla JS or TypeScript, as per repo standards).
- **Library**: `@modelcontextprotocol/sdk`.
- **Parser Library**: Use `pdf-parse` (or similar).
- **Transport**: Standard I/O (stdio). **CRITICAL**: Never use `console.log()` in the server logic, as it corrupts the JSON-RPC stdout stream. Use `console.error()` for debugging.
- **Location**: You must create a new directory called `midi-mcp` and add it to the `"workspaces"` array in the root `package.json`.

## Required Features

### 1. One-Time Extraction Script (Build Step)
Parsing PDFs on the fly is slow. Write a Node.js script inside the `midi-mcp` workspace (e.g., `scripts/extract.js`) that:
1. Iterates over all `.pdf` and `.html` files in the root `.midi-raw-data/` folder.
2. Extracts the text content using `pdf-parse` (or standard HTML parsing).
3. Saves the cleaned, unified text into a new directory: `midi-mcp/data/`.
4. Add this script to `midi-mcp/package.json` as `"extract": "node scripts/extract.js"`.

### 2. Resources (Static Data)
The MCP server (`index.js`) must expose the pre-parsed text files located in `midi-mcp/data/` via the MCP protocol. 
- `midi://parsed/list` -> Returns a list of all parsed files.
- `midi://parsed/read/{filename}` -> Reads the extremely fast, pre-compiled text content.

### 3. Tools (Active Capabilities)
Implement blazing fast search and cross-referencing tools that agents can execute:
- `search_spec_data`: Takes a query string (e.g., "Note On", "SysEx ID") and greps through the pre-parsed Markdown/text files in `midi-mcp/data/`, returning relevant text snippets instantly.
- `fetch_online_resource`: Takes a URL (e.g., from a web search, Wikipedia, or forum) and extracts the clean text content. This allows agents to double-check and verify the local specification data against external, live online resources.

## Integration
Configure the server to run directly in VS Code.

Create or update `.vscode/mcp.json` in the root of the repository:
```json
{
  "mcpServers": {
    "midi-spec-server": {
      "command": "node",
      "args": ["${workspaceFolder}/midi-mcp/index.js"]
    }
  }
}
```

## Step-by-Step Execution Plan for Agent
1. **Setup Workspace**: Create the `midi-mcp/` directory. Run `npm init -y` inside it, and add it to the root `package.json` workspaces. Install `@modelcontextprotocol/sdk` and `pdf-parse` inside the `midi-mcp` workspace.
2. **Write Extraction Script**: Create `scripts/extract.js` and run it once to populate `midi-mcp/data/`.
3. **Build MCP Server**: Write `index.js`. Initialize `Server` and `StdioServerTransport`. Implement the `tools` and `resources` handlers reading exclusively from `midi-mcp/data/`.
4. **Hook it up**: Create `.vscode/mcp.json`.
5. **Verify**: Use MCP tools or inspector to ensure the raw resources are readable and the search tool is lightning fast.
