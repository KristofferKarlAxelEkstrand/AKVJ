import { join } from 'node:path';
import fsp from 'node:fs/promises';
import { AcpClientPool, type AgentState } from './agents/AcpClientPool.js';
import { ApplicationEventBus } from './core/eventBus.js';
import { StateStore } from './core/StateStore.js';
import { TimerService } from './core/TimerService.js';
import { DashboardService } from './services/dashboardService.js';
import { FileWatcherService } from './services/fileWatcherService.js';
import { AGENT_CONFIGS, type AgentRole } from './types/agents.js';
import type { DashboardData } from './types/dashboard.js';

export interface ApplicationOptions {
	workspaceRoot: string;
}

export class Application {
	readonly #workspaceRoot: string;
	readonly #teamDir: string;
	readonly #eventBus: ApplicationEventBus;
	readonly #stateStore: StateStore;
	readonly #pool: AcpClientPool;
	readonly #timers: TimerService;
	readonly #dashboardService: DashboardService;
	readonly #fileWatcher: FileWatcherService;
	#running = false;

	constructor(options: ApplicationOptions) {
		this.#workspaceRoot = options.workspaceRoot;
		this.#teamDir = join(this.#workspaceRoot, '.agents', 'workflows', 'developer-team');
		this.#eventBus = new ApplicationEventBus();
		this.#stateStore = new StateStore(this.#workspaceRoot);
		this.#pool = new AcpClientPool({ workspaceRoot: this.#workspaceRoot, eventBus: this.#eventBus });
		this.#pool.setStateStore(this.#stateStore);

		this.#timers = new TimerService((role: AgentRole) => {
			const prompt = 'Random sweep timer triggered. Run your workflow loop: check messages, do a sweep, file tickets if needed.';
			this.#pool.sendPrompt(role, prompt).catch(() => {});
		});

		this.#dashboardService = new DashboardService({ teamDir: this.#teamDir });

		this.#fileWatcher = new FileWatcherService({
			teamDir: this.#teamDir,
			eventBus: this.#eventBus
		});

		this.#wireEvents();
	}

	get eventBus(): ApplicationEventBus {
		return this.#eventBus;
	}

	isRunning(): boolean {
		return this.#running;
	}

	async start(): Promise<{ ok: boolean; error?: string }> {
		if (this.#running) {
			return { ok: false, error: 'Team already running' };
		}

		for (const config of AGENT_CONFIGS) {
			if (!config.enabled || config.triggerType !== 'file') {
				continue;
			}
			try {
				await this.#pool.startAgent(config);
				console.log(`[pool] Started ${config.role}`);
			} catch (err) {
				console.error(`[pool] Failed to start ${config.role}:`, (err as Error).message);
			}
		}

		for (const config of AGENT_CONFIGS) {
			if (!config.enabled || config.triggerType !== 'timer') {
				continue;
			}
			this.#timers.startAgent(config.role, config.timerIntervalMinMs ?? 600_000, config.timerIntervalMaxMs ?? 1_200_000);
			console.log(`[timers] Scheduled ${config.role}`);
		}

		this.#running = true;
		this.#eventBus.emitEvent({ type: 'team-status', running: true });
		return { ok: true };
	}

	async stop(): Promise<{ ok: boolean; error?: string }> {
		if (!this.#running) {
			return { ok: false, error: 'Team not running' };
		}

		this.#timers.stopAll();
		await this.#pool.stopAll();
		this.#running = false;
		this.#eventBus.emitEvent({ type: 'team-status', running: false });
		return { ok: true };
	}

	async initialize(): Promise<void> {
		await this.#fileWatcher.start();
		await this.#fileWatcher.scanInbox();
	}

	async getDashboard(): Promise<DashboardData> {
		return this.#dashboardService.buildDashboard(this.#pool.getAllStates());
	}

	async sendPrompt(role: AgentRole, text: string): Promise<void> {
		await this.#pool.sendPrompt(role, text);
	}

	getAgentState(role: AgentRole): AgentState | undefined {
		return this.#pool.getAgentState(role);
	}

	getAllAgentStates(): AgentState[] {
		return this.#pool.getAllStates();
	}

	async routeFile(filePath: string, folder: string, filename: string): Promise<void> {
		let role: AgentRole | null = null;
		if (folder === 'inbox' || folder === 'outbox' || folder === 'tasks' || folder.startsWith('tasks/')) {
			role = 'team-lead';
		} else if (folder.startsWith('slack/')) {
			role = folder.slice(6) as AgentRole;
		}

		if (!role) {
			return;
		}

		try {
			const content = await fsp.readFile(filePath, 'utf-8');
			const promptText = `${filename}\n\n<file contents>\n${content}\n</file contents>`;
			await this.#pool.sendPrompt(role, promptText);
		} catch (err) {
			console.error(`[router] Failed to send ${filename} to ${role}:`, (err as Error).message);
		}
	}

	async shutdown(): Promise<void> {
		this.#fileWatcher.stop();
		this.#timers.stopAll();
		await this.#pool.stopAll();
	}

	#wireEvents(): void {
		this.#eventBus.onFileChange(event => this.#routeFileAndRebuild(event));
		this.#eventBus.onStatusChange(() => this.#broadcastDashboard());
		this.#eventBus.onActivity(event => {
			if (event.activityType === 'crashed') {
				console.error(`[pool] Agent ${event.role} crashed: ${event.detail}`);
			}
			this.#broadcastDashboard();
		});
		this.#eventBus.onUpdate(() => this.#broadcastDashboard());
	}

	async #routeFileAndRebuild(event: import('./core/eventBus.js').FileChangeEvent): Promise<void> {
		await this.routeFile(join(this.#teamDir, event.folder, event.filename), event.folder, event.filename);
		await this.#broadcastDashboard();
	}

	async #broadcastDashboard(): Promise<void> {
		try {
			const dashboard = await this.getDashboard();
			this.#eventBus.emitEvent({ type: 'dashboard', dashboard });
		} catch (err) {
			console.error('[dashboard] Failed to broadcast dashboard:', (err as Error).message);
		}
	}
}
