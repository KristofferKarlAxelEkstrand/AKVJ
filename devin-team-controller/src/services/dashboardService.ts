import fsp from 'node:fs/promises';
import path from 'node:path';
import { AGENT_CONFIGS } from '../types/agents.js';
import type { DashboardAgent, DashboardData, DashboardMessage, DashboardTask } from '../types/dashboard.js';
import type { AgentState } from '../agents/AcpClientPool.js';

const MSG_PREFIXES = ['[TASK]', '[REPORT]', '[BLOCKED]', '[APPROVED]', '[REJECTED]', '[AWAITING-APPROVAL]', '[NPM-REQUEST]', '[NIT]', '[TEST]', '[DEPS]', '[LOCK]'];

export interface DashboardServiceOptions {
	teamDir: string;
}

export class DashboardService {
	readonly #teamDir: string;

	constructor(options: DashboardServiceOptions) {
		this.#teamDir = options.teamDir;
	}

	async buildDashboard(agentStates: AgentState[]): Promise<DashboardData> {
		const slackDir = path.join(this.#teamDir, 'slack');

		const agents = await Promise.all(
			AGENT_CONFIGS.map(async config => {
				const agentDir = path.join(slackDir, config.role);
				const entries = await this.#readDir(agentDir);
				const messages: DashboardMessage[] = [];
				for (const entry of entries) {
					if (!entry.isFile() || !entry.name.endsWith('.md')) {
						continue;
					}
					const filePath = path.join(agentDir, entry.name);
					try {
						const stat = await fsp.stat(filePath);
						const prefix = MSG_PREFIXES.find(p => entry.name.startsWith(p)) ?? '';
						messages.push({
							filename: entry.name,
							path: filePath,
							prefix,
							modifiedTime: stat.mtimeMs
						});
					} catch {
						/* skip */
					}
				}
				messages.sort((a, b) => b.modifiedTime - a.modifiedTime);

				const runtimeState = agentStates.find(a => a.role === config.role);
				return {
					role: config.role,
					displayName: config.displayName,
					model: config.model,
					status: runtimeState?.status ?? (messages.length > 0 ? 'has-messages' : 'idle'),
					messageCount: messages.length,
					messages
				} satisfies DashboardAgent;
			})
		);

		const tasksDir = path.join(this.#teamDir, 'tasks');
		const taskEntries = await this.#readDir(tasksDir);
		const tasks: DashboardTask[] = [];
		for (const entry of taskEntries) {
			if (!entry.isFile() || !entry.name.endsWith('.md')) {
				continue;
			}
			const filePath = path.join(tasksDir, entry.name);
			try {
				const [content, stat] = await Promise.all([fsp.readFile(filePath, 'utf-8'), fsp.stat(filePath)]);
				const fm = this.#parseFrontmatter(content);
				const titleMatch = content.match(/^#\s+(.+)$/m);
				tasks.push({
					filename: entry.name,
					title: titleMatch?.[1] ?? entry.name,
					status: fm.status ?? 'unknown',
					assignee: fm.assignee ?? 'none',
					priority: fm.priority ?? 'medium',
					modifiedTime: stat.mtimeMs
				});
			} catch {
				/* skip */
			}
		}
		tasks.sort((a, b) => b.modifiedTime - a.modifiedTime);

		const [inboxCount, outboxCount] = await Promise.all([this.#countMarkdownFiles(path.join(this.#teamDir, 'inbox')), this.#countMarkdownFiles(path.join(this.#teamDir, 'outbox'))]);

		const poolStatus: Record<string, { status: string }> = {};
		for (const state of agentStates) {
			poolStatus[state.role] = { status: state.status };
		}

		return {
			agents,
			tasks,
			inboxCount,
			outboxCount,
			generatedAt: Date.now(),
			poolStatus
		};
	}

	async #readDir(dir: string) {
		try {
			return await fsp.readdir(dir, { withFileTypes: true });
		} catch {
			return [];
		}
	}

	async #countMarkdownFiles(dir: string): Promise<number> {
		const entries = await this.#readDir(dir);
		return entries.filter(entry => entry.isFile() && entry.name.endsWith('.md')).length;
	}

	#parseFrontmatter(content: string): Record<string, string> {
		const match = content.match(/^---\n([\s\S]*?)\n---/);
		if (!match) {
			return {};
		}
		const out: Record<string, string> = {};
		for (const line of match[1].split('\n')) {
			const separatorIndex = line.indexOf(':');
			if (separatorIndex !== -1) {
				out[line.slice(0, separatorIndex).trim()] = line.slice(separatorIndex + 1).trim();
			}
		}
		return out;
	}
}
