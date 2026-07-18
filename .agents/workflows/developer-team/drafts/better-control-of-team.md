# Dev Extension for Developer Team Control

## Status: Draft / Investigation (2026-07-18)

## Problem

The current developer team workflow requires manually spawning 6-8 separate chat windows, pasting startup prompts into each, and relying on `await-messages.js` polling scripts that have reliability issues (Task 203). The harness kills background polling processes, leaving agents stuck in a "looks asleep but is actually gone" state. There is no unified view of agent activity, and managing the team is cumbersome.

**Root cause:** Agents run their own polling scripts as background tasks. The IDE harness (Cursor/Windsurf) can abort these background commands after a few seconds — the agent looks "asleep" but the poller is dead. This is documented in `collaboration-protocol.md` § The Sleep Step and confirmed in the Task 203 investigation report.

## Goal

A Dev (Devin Desktop) extension that:
1. **Centralizes agent control** — spawn, monitor, and message all team agents from one panel
2. **Replaces the poller** — the extension watches files and pushes messages to agents via ACP; agents never run polling scripts
3. **Displays chats in-panel** — agent conversations stream into the extension UI via ACP `session/update` notifications
4. **Preserves the file-based protocol** — the existing inbox/slack/outbox markdown system stays as the inter-agent communication backbone
5. **User controls which agents run and what model each uses** — per-agent configuration in the extension UI

---

## Feasibility Assessment

**Verdict: Yes, fully feasible. All building blocks are production-ready.**

The extension is a standard VS Code extension running in Devin Desktop (a VS Code fork). It acts as an **ACP client** — spawning agent processes as child processes and communicating via JSON-RPC over stdio. No cloud API needed. No ACU costs. Agents run locally.

### Building Blocks

| Capability | Technology | Status |
| --- | --- | --- |
| Custom UI panel in Devin Desktop | VS Code Webview API (`createWebviewPanel` / `registerWebviewViewProvider`) | Stable, well-documented |
| File watching (replace polling scripts) | VS Code `FileSystemWatcher` or Node.js `fs.watch` | Built into extension runtime |
| Spawn and manage agent processes | `child_process.spawn()` + ACP JSON-RPC over stdio | Open protocol, multiple production implementations |
| ACP TypeScript SDK | `@agentclientprotocol/sdk` (`ClientSideConnection`) | Official, npm published |
| Agent binary | `devin acp` (Devin CLI) — supports `--model`, `--permission-mode` flags | Production, documented |
| Multi-agent concurrent sessions | Devin Desktop 2.0 Agent Command Center — Kanban view, Spaces | Core feature, NVIDIA as design partner |

---

## Architecture: Extension as ACP Orchestrator

The extension is the ACP client and the orchestrator. It spawns agent processes, watches files, routes messages, and displays everything in a webview panel. Agents are passive — they receive prompts, do work, and return. The extension decides when to wake each agent.

### How the poller problem is solved

| Current (agent-run poller) | Extension (orchestrator) |
| --- | --- |
| Agent runs `await-messages.js slack/akvj-developer` as background task | Extension watches `slack/akvj-developer/` via `fs.watch` |
| Harness kills the background process → agent stuck | Extension is the extension host process — never killed by agent timeout |
| New file arrives → script exits code 0 → harness resumes agent | New file arrives → extension reads it → sends content via ACP `session/prompt` |
| Agent re-reads prompt, checks mailbox, processes, sleeps again | Agent receives file content as a prompt turn, processes, returns `stopReason` |
| Overseer/Nitpicker use `await-messages-random.js` for timer wakeups | Extension has internal `setInterval` timers per agent — sends "do a sweep" prompt |
| Duplicate pollers on restart (orphaned processes) | Extension owns all processes — clean kill on stop, clean spawn on start |

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│  Devin Desktop (VS Code fork)                                │
│                                                              │
│  ┌────────────────┐     ┌─────────────────────────────────┐ │
│  │  Webview UI    │◄───►│  Extension Backend (Node.js)    │ │
│  │  (Sidebar)     │     │                                 │ │
│  │                │     │  ┌──────────────────────────┐   │ │
│  │  Agent cards   │     │  │  AcpClientPool           │   │ │
│  │  Chat streams  │     │  │  • spawn() per agent     │   │ │
│  │  Dashboard     │     │  │  • session/new           │   │ │
│  │  Compose box   │     │  │  • session/prompt        │   │ │
│  │  Agent config  │     │  │  • session/update → UI   │   │ │
│  │  Start/Stop    │     │  │  • session/cancel        │   │ │
│  └────────────────┘     │  └──────────────────────────┘   │ │
│                         │                                 │ │
│                         │  ┌──────────────────────────┐   │ │
│                         │  │  FileWatcher             │   │ │
│                         │  │  • inbox/                │   │ │
│                         │  │  • slack/team-lead/      │   │ │
│                         │  │  • slack/akvj-developer/ │   │ │
│                         │  │  • slack/qa-reviewer/    │   │ │
│                         │  │  • outbox/               │   │ │
│                         │  │  • tasks/                │   │ │
│                         │  └───────────┬──────────────┘   │ │
│                         │              │                  │ │
│                         │  ┌───────────▼──────────────┐   │ │
│                         │  │  MessageRouter           │   │ │
│                         │  │  file change → which     │   │ │
│                         │  │  agent gets the prompt   │   │ │
│                         │  └──────────────────────────┘   │ │
│                         │                                 │ │
│                         │  ┌──────────────────────────┐   │ │
│                         │  │  TimerService            │   │ │
│                         │  │  • Overseer: 10-20 min   │   │ │
│                         │  │  • Nitpicker: 10-20 min  │   │ │
│                         │  │  • Test Marshal: opt.    │   │ │
│                         │  │  • Quartermaster: opt.   │   │ │
│                         │  └──────────────────────────┘   │ │
│                         └──────┬──────┬──────┬──────┬─────┘ │
│                                │      │      │      │       │
│                    ┌───────────▼┐ ┌──▼───┐ ┌▼────┐ ┌▼────┐  │
│                    │ devin acp  │ │devin │ │devin│ │devin│  │
│                    │ --model    │ │acp   │ │acp  │ │acp  │  │
│                    │ sonnet-4   │ │      │ │     │ │     │  │
│                    │            │ │      │ │     │ │     │  │
│                    │ Team Lead  │ │AKVJ  │ │QA   │ │Over-│  │
│                    │ session    │ │Dev   │ │Rev  │ │seer │  │
│                    └────────────┘ └──────┘ └─────┘ └─────┘  │
│                         │          │        │       │       │
│                    ┌────▼──────────▼────────▼───────▼────┐  │
│                    │  Local filesystem (shared)          │  │
│                    │  .agents/workflows/developer-team/  │  │
│                    │  ├── inbox/                         │  │
│                    │  ├── slack/*/                       │  │
│                    │  ├── outbox/                        │  │
│                    │  ├── tasks/                         │  │
│                    │  └── prompts/*.prompt.md            │  │
│                    └─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
```

### Per-agent configuration

The user controls which agents to start and what model each uses:

```typescript
interface AgentConfig {
  id: string;                    // 'team-lead', 'akvj-developer', etc.
  name: string;                  // Display name
  promptPath: string;            // Path to .prompt.md file
  watchDirs: string[];           // Directories to watch for this agent
  command: string;               // Agent binary (e.g., 'devin')
  args: string[];                // CLI args (e.g., ['acp', '--model', 'claude-sonnet-4'])
  timerDriven?: boolean;         // If true, extension wakes on interval
  timerIntervalMs?: [min: number, max: number];  // Random interval range for timer-driven agents
  permissionMode: 'normal' | 'dangerous' | 'bypass';  // ACP permission handling
  enabled: boolean;              // User can toggle agents on/off
}
```

Example configs:
```typescript
const agentConfigs: AgentConfig[] = [
  {
    id: 'team-lead',
    name: 'Team Lead',
    promptPath: '.agents/workflows/developer-team/prompts/team-lead.prompt.md',
    watchDirs: ['inbox/', 'slack/team-lead/'],
    command: 'devin',
    args: ['acp', '--model', 'claude-sonnet-4'],
    permissionMode: 'dangerous',  // auto-approve for autonomous operation
    enabled: true,
  },
  {
    id: 'akvj-developer',
    name: 'AKVJ Developer',
    promptPath: '.../akvj-developer.prompt.md',
    watchDirs: ['slack/akvj-developer/'],
    command: 'devin',
    args: ['acp', '--model', 'claude-sonnet-4'],
    permissionMode: 'dangerous',
    enabled: true,
  },
  {
    id: 'overseer',
    name: 'Overseer',
    promptPath: '.../overseer.prompt.md',
    watchDirs: ['slack/overseer/', 'outbox/'],
    command: 'devin',
    args: ['acp', '--model', 'claude-haiku'],  // cheaper model for sweeps
    timerDriven: true,
    timerIntervalMs: [10 * 60 * 1000, 20 * 60 * 1000],  // 10-20 min random
    permissionMode: 'dangerous',
    enabled: true,
  },
  {
    id: 'nitpicker',
    name: 'Nitpicker',
    promptPath: '.../nitpicker.prompt.md',
    watchDirs: ['slack/nitpicker/'],
    command: 'devin',
    args: ['acp', '--model', 'claude-haiku'],
    timerDriven: true,
    timerIntervalMs: [10 * 60 * 1000, 20 * 60 * 1000],
    permissionMode: 'dangerous',
    enabled: false,  // user can toggle off
  },
];
```

### ACP message flow (concrete)

When a file appears in `slack/akvj-developer/`:

```
1. FileWatcher detects new file: slack/akvj-developer/[TASK]-205-add-knob.md
2. MessageRouter maps: slack/akvj-developer/ → agent 'akvj-developer'
3. Extension reads file contents
4. Extension sends ACP session/prompt:
   {
     "sessionId": "sess_akvj_dev_001",
     "prompt": [{
       "type": "text",
       "text": "[TASK]-205-add-knob.md\n\n<file contents>"
     }]
   }
5. Agent processes the task:
   - Agent reads code, writes changes, runs tests
   - Agent streams session/update notifications:
     { "sessionUpdate": "agent_message_chunk", "content": { "text": "Looking at..." } }
     { "sessionUpdate": "tool_call", "title": "Read file", "status": "completed" }
     { "sessionUpdate": "agent_message_chunk", "content": { "text": "I've added..." } }
   - Extension forwards these to the webview in real time
6. Agent finishes, returns session/prompt response:
   { "stopReason": "end_turn" }
7. Extension marks agent status as "idle"
8. Agent wrote [REPORT]-205-add-knob.md to slack/team-lead/ as part of its work
9. FileWatcher detects that → routes to Team Lead agent → cycle continues
```

### Timer-driven agents (replacing `await-messages-random.js`)

For the Overseer, Nitpicker, Test Marshal, and Quartermaster:

```
1. TimerService fires after random 10-20 min interval
2. Extension sends session/prompt to the agent:
   {
     "sessionId": "sess_overseer_001",
     "prompt": [{
       "type": "text",
       "text": "Random sweep timer triggered. Run your workflow loop: check messages, do a product or process sweep (alternate per your next-sweep-mode.md), file tickets if needed."
     }]
   }
3. Agent does its sweep, streams updates, returns
4. TimerService resets with a new random interval
```

No `await-messages-random.js` needed. No special missions dice roll — that can move into the extension's TimerService if desired.

### What changes in agent prompts

The prompts need modification but the changes are **surgical** — remove the sleep step, keep everything else:

**Remove from every prompt:**
- The entire "Go to Sleep" step (Step 4/5/6 depending on role)
- All references to `await-messages.js` and `await-messages-random.js`
- The "run as background task, then end your turn" instructions
- The `[PROMPT-UPDATED]` self-exit flow (the extension handles prompt reloads by killing and respawning the process)

**Keep in every prompt:**
- Read messages from slack folder
- Process work / do sweeps / review code
- Write reports / file tickets / update dashboard
- All the domain logic (git rules, concurrency locks, self-healing, etc.)

**Add to every prompt:**
- A note that the orchestrator will send messages as prompt turns — the agent should just process and return, no sleeping needed

### Permission handling

ACP agents request permission for tool calls (file writes, terminal commands). For a team of 6+ autonomous agents, auto-approve is necessary:

```typescript
// ACP client handler
async requestPermission(params: AcpPermissionRequest): Promise<AcpPermissionResponse> {
  // Auto-approve all tool calls for autonomous operation
  // Could surface to user for high-risk operations (git push, npm install, etc.)
  return {
    outcome: {
      outcome: 'selected',
      optionId: params.options[0].optionId,  // typically "allow"
    },
  };
}
```

The `devin acp` CLI also supports `--permission-mode bypass` which skips permission requests entirely. This is the simplest approach for the team — the extension can still log all tool calls for auditability.

### Process lifecycle and crash recovery

```typescript
class AcpClientPool {
  // One child process per agent
  private agents: Map<string, AcpClient> = new Map();

  async startAgent(config: AgentConfig): Promise<void> {
    const client = new AcpClient(config.command, config.args);
    await client.initialize();        // ACP initialize handshake
    const sessionId = await client.newSession(process.cwd());
    this.agents.set(config.id, client);

    // Crash detection
    client.onExit((code, signal) => {
      console.error(`Agent ${config.id} exited: code=${code} signal=${signal}`);
      if (this.shouldRestart(config)) {
        this.restartAgent(config);    // Re-spawn and session/load if supported
      }
    });
  }

  async stopAgent(agentId: string): Promise<void> {
    const client = this.agents.get(agentId);
    if (client) {
      await client.cancel();           // Cancel any in-flight turn
      client.kill();                   // SIGTERM the process
      this.agents.delete(agentId);
    }
  }

  async stopAll(): Promise<void> {
    // Clean shutdown of all agents — no orphaned processes
    for (const [id] of this.agents) {
      await this.stopAgent(id);
    }
  }
}
```

### Session persistence and resume

The ACP spec supports `session/load` (replay history) and `session/resume` (reconnect without replay). If the agent binary supports these, the extension can:

1. Persist session IDs to a state file on disk
2. On restart, call `session/resume` to reconnect without losing conversation history
3. If `session/resume` is not supported, call `session/load` to replay history

The `devin acp` CLI has session management (`/resume`, `/continue`) and persists sessions to `sessions.db`. The Paseo Devin Bridge project demonstrates this pattern — persisting session mappings to disk and resuming from Devin's session store after process restarts.

## Implementation Phases

### Phase 1: Observation Dashboard (MVP)
- VS Code extension with a webview sidebar
- Reads the existing file-based protocol (inbox, slack, outbox, tasks, dashboard)
- Displays agent statuses, task assignments, and activity feed
- **No session management** — just a better view of the existing system
- Replaces the need to manually open multiple files/folders to see what's happening
- Works with the current manual chat-window workflow — no changes to agent prompts

### Phase 2: File Watcher + Notifications
- Extension watches files and shows real-time notifications when:
  - New task arrives in inbox
  - Team Lead assigns a task to a developer's slack
  - QA posts a review verdict
  - Agent goes to sleep / wakes up
- Extension generates the dashboard automatically (replaces `generate-dashboard.js`)
- **Still no session management** — just better monitoring of the manual workflow

### Phase 3: ACP Orchestrator (Poller Replacement)
- Extension spawns agent processes via `child_process.spawn('devin', ['acp', '--model', ...])`
- ACP handshake: `initialize` → `session/new` → send prompt file as first `session/prompt`
- FileWatcher replaces `await-messages.js` — file changes → `session/prompt` to the right agent
- TimerService replaces `await-messages-random.js` — interval timers for Overseer/Nitpicker/etc.
- `session/update` notifications stream into the webview as real-time chat
- Agent prompts updated: remove sleep steps, keep all domain logic
- `await-messages.js` and `await-messages-random.js` are retired
- User can select which agents to start and what model each uses
- Permission handling: `--permission-mode bypass` or auto-approve in ACP client

### Phase 4: Full Team Automation
- One-click "Start Team" spawns all enabled agent processes
- One-click "Stop Team" cleanly kills all processes (no orphaned pollers)
- Compose box in the webview to send messages to individual agents or the whole team
- Task routing logic moves from the Team Lead agent to the extension (optional)
- Activity timeline showing the full history of the team's work
- Agent chat logs are persisted to the existing file-based protocol for auditability
- Session persistence: save session IDs, resume on restart via `session/resume`
- Crash recovery: auto-restart crashed agents, resume session if possible

---

## Technical Details

### Extension Structure

```
devin-team-controller/
├── package.json              # VS Code extension manifest
├── tsconfig.json
├── src/
│   ├── extension.ts          # Extension entry point (activate/deactivate)
│   ├── acp/
│   │   ├── AcpClient.ts      # Single ACP client (spawn, initialize, session/prompt, notifications)
│   │   ├── AcpClientPool.ts  # Manages N agent processes, lifecycle, crash recovery
│   │   └── types.ts          # ACP protocol types (subset of @agentclientprotocol/sdk)
│   ├── core/
│   │   ├── FileWatcher.ts    # fs.watch on inbox/, slack/*/, outbox/, tasks/
│   │   ├── MessageRouter.ts  # Maps file paths → agent IDs (which agent gets the prompt)
│   │   ├── TimerService.ts   # setInterval per timer-driven agent (Overseer, Nitpicker, etc.)
│   │   ├── DashboardGenerator.ts  # Replaces generate-dashboard.js
│   │   └── StateStore.ts     # Persisted state (session IDs, agent configs, last-seen files)
│   ├── views/
│   │   ├── TeamPanel.ts      # Webview panel provider (sidebar)
│   │   ├── ChatView.ts       # Per-agent chat stream from session/update notifications
│   │   └── AgentConfigView.ts # Per-agent model/permission/enable config UI
│   └── types/
│       └── agents.ts         # AgentConfig interface, agent role definitions
├── webview/                  # Frontend assets for the webview
│   ├── index.html
│   ├── main.js               # Chat rendering, agent cards, compose box
│   └── style.css
└── media/
    └── icons/                # Agent role icons
```

### Dependencies

```json
{
  "dependencies": {
    "@agentclientprotocol/sdk": "^1.0.0"
  },
  "devDependencies": {
    "@types/vscode": "^1.85.0",
    "typescript": "^5.0.0"
  },
  "engines": {
    "vscode": "^1.85.0"
  }
}
```

### Minimal ACP client (core of the extension)

Using the official `@agentclientprotocol/sdk`:

```typescript
import { spawn } from 'node:child_process';
import { Writable, Readable } from 'node:stream';
import * as acp from '@agentclientprotocol/sdk';

class TeamAcpClient {
  #process: ChildProcess;
  #connection: acp.ClientSideConnection;
  #sessionId: string | null = null;
  #onUpdate: (update: acp.SessionUpdate) => void;

  constructor(
    command: string,
    args: string[],
    cwd: string,
    onUpdate: (update: acp.SessionUpdate) => void,
  ) {
    this.#onUpdate = onUpdate;
    this.#process = spawn(command, args, {
      cwd,
      stdio: ['pipe', 'pipe', 'inherit'],
    });

    const input = Writable.toWeb(this.#process.stdin!);
    const output = Readable.toWeb(this.#process.stdout!) as ReadableStream<Uint8Array>;

    const client: acp.Client = {
      requestPermission: async () => ({
        outcome: { outcome: 'selected', optionId: 'allow' },
      }),
      sessionUpdate: async (params) => {
        this.#onUpdate(params.update);
      },
      readTextFile: async () => ({ content: '' }),
      writeTextFile: async () => ({}),
    };

    const stream = acp.ndJsonStream(input, output);
    this.#connection = new acp.ClientSideConnection((_agent) => client, stream);
  }

  async initialize(): Promise<void> {
    await this.#connection.initialize({
      protocolVersion: acp.PROTOCOL_VERSION,
      clientCapabilities: {
        fs: { readTextFile: true, writeTextFile: true },
      },
    });
  }

  async newSession(cwd: string): Promise<string> {
    const result = await this.#connection.newSession({ cwd, mcpServers: [] });
    this.#sessionId = result.sessionId;
    return result.sessionId;
  }

  async prompt(text: string): Promise<acp.StopReason> {
    if (!this.#sessionId) throw new Error('No session');
    const result = await this.#connection.prompt({
      sessionId: this.#sessionId,
      prompt: [{ type: 'text', text }],
    });
    return result.stopReason;
  }

  async cancel(): Promise<void> {
    if (this.#sessionId) {
      await this.#connection.cancel({ sessionId: this.#sessionId });
    }
  }

  kill(): void {
    this.#process.kill('SIGTERM');
  }

  onExit(handler: (code: number | null, signal: NodeJS.Signals | null) => void): void {
    this.#process.on('exit', handler);
  }
}
```

### Agent Role Definitions

All 8 agents (6 core + 2 optional):

| Agent | Type | Watch Dirs | Timer | Default Model |
| --- | --- | --- | --- | --- |
| Team Lead | Event-driven | `inbox/`, `slack/team-lead/` | No | claude-sonnet-4 |
| AKVJ Developer | Event-driven | `slack/akvj-developer/` | No | claude-sonnet-4 |
| Mainframe Developer | Event-driven | `slack/mainframe-developer/` | No | claude-sonnet-4 |
| QA Reviewer | Event-driven | `slack/qa-reviewer/` | No | claude-sonnet-4 |
| Overseer | Timer + event | `slack/overseer/`, `outbox/` | 10-20 min | claude-haiku |
| Nitpicker | Timer + event | `slack/nitpicker/` | 10-20 min | claude-haiku |
| Test Marshal (optional) | Timer + event | `slack/test-marshal/` | 15-30 min | claude-haiku |
| Quartermaster (optional) | Timer + event | `slack/quartermaster/` | 15-30 min | claude-haiku |

### Webview UI Mockup

```
┌─────────────────────────────────────────────────┐
│  AKVJ Developer Team                       [⚙]  │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─ Agents ───────────────────────────────────┐ │
│  │ ✓ Team Lead       ● idle    sonnet-4       │ │
│  │ ✓ AKVJ Developer  ● working sonnet-4       │ │
│  │ ✓ Mainframe Dev   ● idle    sonnet-4       │ │
│  │ ✓ QA Reviewer     ● idle    sonnet-4       │ │
│  │ ✓ Overseer        ● idle    haiku  14m left│ │
│  │ ✓ Nitpicker       ○ off     haiku          │ │
│  │ ○ Test Marshal    ○ off     haiku          │ │
│  │ ○ Quartermaster   ○ off     haiku          │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  [ Start Team ]  [ Stop Team ]  [ Settings ]    │
│                                                 │
│  ┌─ AKVJ Developer Chat ──────────────────────┐ │
│  │ [orchestrator] [TASK]-205-add-knob.md      │ │
│  │                 <file contents>            │ │
│  │ [agent] Looking at the MIDI mapping...     │ │
│  │ [agent] 🔧 Read file: settings.js          │ │
│  │ [agent] I've added the knob mapping to     │ │
│  │        channel 5...                        │ │
│  │ [agent] 🔧 Run command: npm run test       │ │
│  │ [agent] Tests pass. Writing report.        │ │
│  │ [agent] ✅ Done. Stop reason: end_turn     │ │
│  └─────────────────────────────────────────────┘ │
│                                                 │
│  ┌─ Compose ─────────────────────────────────┐ │
│  │ To: [AKVJ Developer ▼]                    │ │
│  │ ┌───────────────────────────────────────┐ │ │
│  │ │ Type a message...                     │ │ │
│  │ └───────────────────────────────────────┘ │ │
│  │                              [Send]       │ │
│  └───────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

### Settings panel (per-agent config)

```
┌─────────────────────────────────────────────────┐
│  Agent Settings                          [✕]     │
├─────────────────────────────────────────────────┤
│                                                 │
│  Team Lead                              [✓] On  │
│  Model:    [claude-sonnet-4        ▼]           │
│  Permission: [bypass              ▼]            │
│  Watch:    inbox/, slack/team-lead/             │
│                                                 │
│  AKVJ Developer                         [✓] On  │
│  Model:    [claude-sonnet-4        ▼]           │
│  Permission: [bypass              ▼]            │
│  Watch:    slack/akvj-developer/                │
│                                                 │
│  Overseer                               [✓] On  │
│  Model:    [claude-haiku           ▼]           │
│  Permission: [bypass              ▼]            │
│  Watch:    slack/overseer/, outbox/             │
│  Timer:    10-20 min (random)                   │
│                                                 │
│  Nitpicker                              [○] Off │
│  Model:    [claude-haiku           ▼]           │
│  ...                                            │
│                                                 │
│  Agent binary: [devin            ▼]             │
│  (can also be: claude, codex, custom wrapper)   │
│                                                 │
└─────────────────────────────────────────────────┘
```

---

## Cost & Prerequisites

| Requirement | Details |
| --- | --- |
| Devin Desktop | Extension runs inside Devin Desktop (VS Code fork) |
| Node.js 18+ | Extension backend runs in VS Code's extension host |
| Devin CLI | `devin` binary on PATH, authenticated via `devin auth login` |
| `@agentclientprotocol/sdk` | npm dependency for ACP client |
| LLM API access | Via Devin CLI's built-in auth (WINDSURF_API_KEY or `devin auth login`) |
| No cloud API key needed | Local-first approach avoids Devin REST API entirely |
| No ACU budget needed | Agents run locally; cost is in LLM tokens, not Devin cloud ACUs |
| No polling scripts needed | Extension replaces `await-messages.js` and `await-messages-random.js` |

### LLM token cost considerations

- **Event-driven agents** (Team Lead, Developers, QA): only consume tokens when processing a task. Idle = zero cost.
- **Timer-driven agents** (Overseer, Nitpicker): consume tokens on every sweep interval. Using a cheaper model (haiku) keeps costs low.
- **User control**: the extension UI lets you toggle agents off, adjust timer intervals, and pick cheaper models — directly controlling spend.

---

## Research Findings: ACP Feasibility (2025-07-18)

### Q1: Can Devin Desktop run multiple concurrent agent sessions?

**Answer: YES — this is a core feature of Devin Desktop 2.0.**

- The **Agent Command Center** (Devin Desktop 2.0) is explicitly built for managing multiple agents simultaneously. Kanban view shows all agents grouped by status.
- Board includes both **local agents** (Cascade/Devin Local sessions) and **cloud agents** (Devin cloud sessions), all visible at once.
- **Spaces** group multiple agent sessions — docs describe "one local Cascade session prototyping the UI and two cloud Devin sessions handling API changes and writing tests" in a single Space.
- NVIDIA is a design partner: "Our engineers run multiple agents every day and Devin Desktop is the first tool that lets them manage all of them together."
- **Arena Mode** runs multiple Cascade instances in parallel with separate git worktrees.
- ACP spec supports `session/new` — a single agent process can handle multiple independent sessions.

### Q2: Can a VS Code extension programmatically send messages to ACP sessions?

**Answer: YES — the extension is the ACP client itself.**

- **ACP is JSON-RPC over stdio** — any process that can spawn a child process and read/write stdin/stdout can be an ACP client.
- **Real-world VS Code extensions already do this:**
  - `vscode-acp` (Marketplace) — spawns agent processes, manages sessions, displays chat UI, handles permissions. 300+ stars.
  - Qwen Code's VS Code companion (`acpConnection.ts`) — spawns `cli.js --acp`, sends `initialize` → `session/new` → `session/prompt`, listens for `session/update`.
  - Paseo Devin Bridge — pools Devin CLI child processes, manages ACP sessions, persists session mappings, resumes after crashes.
- **ACP TypeScript SDK** (`@agentclientprotocol/sdk`) provides `ClientSideConnection` for building clients.
- **Minimal ACP client is ~30 lines of JS** (per Cursor CLI docs).
- The extension can spawn **N child processes** (one per agent role) and manage them independently.

### Q3: Can the extension replace `await-messages.js`?

**Answer: YES — and this is the primary value proposition.**

The root cause of the polling failure is that agents run polling scripts as background tasks, and the IDE harness kills those background tasks. The extension solves this because:
- The extension host process is **not** subject to agent tool-call timeouts
- `fs.watch` / `FileSystemWatcher` runs in the extension host, not in an agent's tool call
- When a file arrives, the extension pushes it to the agent via `session/prompt` — the agent doesn't need to poll at all
- Timer-driven agents are woken by the extension's `setInterval`, not by `await-messages-random.js`

### Q4: Can the user choose which agents run and what model each uses?

**Answer: YES — full per-agent configuration.**

- `devin acp` supports `--model <model>` and `--permission-mode <mode>` CLI flags
- The extension spawns each agent with its own args, so each agent can use a different model
- The ACP protocol also has `session/set_config_option` for changing settings mid-session
- The extension UI provides toggles to enable/disable agents and dropdowns to select models
- Agent binary is also configurable — can use `devin`, `claude`, `codex`, or any ACP-compatible agent

### Key architecture insight

The extension **is** the ACP client. It doesn't need Devin Desktop's ACP registry or built-in ACP UI. It manages its own processes. This gives:
- **No dependency on Devin Desktop's ACP integration** — the extension is self-contained
- **Full control over process lifecycle** — spawn, message, cancel, restart, clean shutdown
- **Full control over chat display** — `session/update` notifications stream directly into the webview
- **Can run any ACP-compatible agent** — not limited to Devin's built-in agents
- **No orphaned pollers** — the extension owns all processes, clean kill on stop

---

## Remaining Open Questions

1. **Devin CLI `session/cancel` support** — The Paseo Devin Bridge docs note that native Devin `session/cancel` returns `Method not found`. The workaround is SIGTERM + restart. Need to verify if this is still the case with current `devin acp`.
2. **Session resume across restarts** — `devin acp` persists sessions to `sessions.db`. Need to test whether `session/resume` works after killing and respawning the process, or if `session/load` (full history replay) is needed.
3. **Inter-agent routing** — Currently the Team Lead writes files to developer slack folders. In the extension model, should the Team Lead still write files (which the extension watches and routes), or should the extension intercept the Team Lead's output and route directly to other agent sessions via `session/prompt`? **Recommendation: keep file-based routing** — it's the existing protocol, it's auditable, and the extension just watches and forwards.
4. **Prompt updates** — Currently the Overseer sends `[PROMPT-UPDATED]` notices and agents self-exit. In the extension model, the extension can detect prompt file changes, kill the agent process, and respawn with the new prompt loaded as the initial `session/prompt`. Simpler and more reliable.
5. **Concurrent file writes** — Multiple agents writing to the same directory (e.g., `slack/team-lead/`) could race. The file-based protocol already handles this (file names are unique with prefixes), but the extension should be aware of it.
6. **MCP servers** — ACP supports passing MCP servers to `session/new`. Should the extension pass any MCP servers to the agents? (e.g., the midi-mcp server for AKVJ agents)

---

## Next Steps

1. **Verify `devin acp` is installed** — Run `which devin` and `devin auth login` if needed
2. **Test single-agent ACP spawn** — Spawn one `devin acp` process from a Node.js script, send `initialize` → `session/new` → `session/prompt` with the Team Lead prompt, verify `session/update` notifications arrive
3. **Prototype Phase 1** — Build the observation dashboard extension (no session management, just file reading + UI)
4. **Prototype Phase 3** — Build the ACP client pool, file watcher, message router, and timer service
5. **Update agent prompts** — Remove sleep steps from all 8 prompt files, add orchestrator note
6. **Test end-to-end** — Run a full team cycle: file in inbox → Team Lead processes → assigns task → developer processes → QA reviews → done
7. **Iterate** — Add crash recovery, session persistence, settings UI, compose box
