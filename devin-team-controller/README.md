# Devin Team Controller

A pure Node.js server for centralized control and monitoring of the AKVJ developer team.

## Prerequisites

1. **Node.js 20+** for building
2. **Devin CLI authenticated** — run `devin auth login` in a terminal, or set `WINDSURF_API_KEY` in your environment. The controller spawns `devin` processes on your behalf, so auth must work before starting the team.
3. **AKVJ repo open** at its workspace root

### Verify Devin CLI is available

The controller searches for the `devin` binary in two places:

1. `PATH` — run `which devin` to check
2. `~/.devin-server/bin/*/extensions/windsurf/devin/bin/devin` — the default install location

If neither is found, the controller logs an error and refuses to start agents.

```bash
# Check PATH
which devin

# Check known install location
ls ~/.devin-server/bin/*/extensions/windsurf/devin/bin/devin 2>/dev/null

# Verify auth
devin auth status
```

## Build

```bash
cd devin-team-controller
npm install
npm run compile
```

## Run

```bash
npm start -- /path/to/akvj
```

Or from the AKVJ repo root:

```bash
node devin-team-controller/dist/server/server.js /path/to/akvj
```

For development, compile and run once:

```bash
npm run dev -- /path/to/akvj
```

For auto-recompilation in another terminal:

```bash
npm run watch
```

The dashboard will be available at **http://localhost:3333** (or port set via `TEAM_DASHBOARD_PORT` env var).

## Usage

1. Open http://localhost:3333 in a browser
2. Click **Start Team** to spawn all enabled agents
3. Agents initialize, load their role prompts, and become idle — ready to receive work
4. Drop a task file into `.agents/workflows/developer-team/inbox/` to trigger the Team Lead
5. Use the **Compose** section to send messages directly to agents

## Configuration

Agent defaults are defined in `src/types/agents.ts`. You can edit this file to:

- **Enable / disable** individual agents
- **Adjust timer intervals** for sweep agents (Overseer, Nitpicker, Test Marshal, Quartermaster)

**Note:** All agents use the SWE-1.6 model. This is fixed and should not be changed.

After editing, run `npm run compile` to rebuild.

### Workspace root assumption

The controller uses the first argument or current working directory as the workspace root. All file paths (prompt files, inbox/slack/outbox dirs) are resolved relative to this root.

### MCP servers

The `akvj-developer` and `mainframe-developer` agents are configured to receive the `midi-mcp` server in their ACP session. This gives them access to the MIDI 1.0/2.0 spec knowledge base. The `midi-mcp/src/index.js` entry point must exist (run `npm install` at the repo root first).

## Stopping

- **Stop Team** button — cleanly shuts down all agent processes (SIGTERM → SIGKILL after 5s)
- **Ctrl+C** in the terminal — triggers graceful shutdown

## Troubleshooting

**"devin binary not found"**

- Run `which devin` and check the known install path above
- Set `DEVIN_PATH` env var or add the binary dir to `PATH`

**Agent crashes immediately**

- Check that `devin auth login` succeeded: `devin auth status`
- Check the controller output for error messages
- If using `WINDSURF_API_KEY`, verify it is exported in the environment

**Files not triggering agents**

- Confirm the repo path is correct
- Check that the file was written to the correct path (e.g. `slack/akvj-developer/`, not `slack/akvj_developer/`)
- The file watcher debounces events by 500ms — rapid writes may coalesce

**Agent prompt not loading**

- Confirm the prompt file exists: `ls .agents/workflows/developer-team/prompts/`
- Check the controller output for the resolved prompt file path

## Architecture

```
devin-team-controller/
├── src/
│   ├── server/            # HTTP server & routing
│   │   ├── server.ts
│   │   └── routes.ts
│   ├── services/          # Business logic
│   │   ├── teamService.ts
│   │   ├── dashboardService.ts
│   │   └── fileWatcherService.ts
│   ├── agents/            # Devin ACP client & pool
│   │   ├── AcpClient.ts
│   │   └── AcpClientPool.ts
│   ├── core/              # Shared utilities
│   │   ├── StateStore.ts
│   │   └── TimerService.ts
│   └── types/             # TypeScript definitions
│       ├── agents.ts
│       └── dashboard.ts
├── public/                # Static frontend assets
│   ├── index.html
│   ├── css/style.css
│   ├── js/main.js
│   └── icons/
├── test/                  # Tests
│   ├── unit/
│   └── integration/
└── dist/                  # Compiled output
```

- **Node.js server** (`dist/server/server.js`) — HTTP server with SSE for real-time updates
- **TypeScript core** (`src/`) — Agent pool, ACP client, state management
- **Vanilla JS frontend** (`public/`) — Dashboard UI with real-time agent monitoring
