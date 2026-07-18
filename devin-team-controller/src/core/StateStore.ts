import { join } from 'node:path';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import type { AgentRole } from '../types/agents.js';

export interface PersistedAgentState {
	role: AgentRole;
	sessionId: string | null;
	model: string;
	enabled: boolean;
}

export interface PersistedState {
	agentStates: PersistedAgentState[];
	lastSaved: number;
}

export class StateStore {
	readonly #stateDir: string;
	readonly #stateFile: string;

	constructor(workspaceRoot: string) {
		this.#stateDir = join(workspaceRoot, '.agents', 'workflows', 'developer-team', 'memory');
		this.#stateFile = join(this.#stateDir, 'server-state.json');
	}

	async load(): Promise<PersistedState | null> {
		try {
			const content = await readFile(this.#stateFile, 'utf-8');
			return JSON.parse(content) as PersistedState;
		} catch {
			return null;
		}
	}

	async save(state: PersistedState): Promise<void> {
		if (!existsSync(this.#stateDir)) {
			await mkdir(this.#stateDir, { recursive: true });
		}
		const content = JSON.stringify(state, null, 2);
		await writeFile(this.#stateFile, content, 'utf-8');
	}

	async saveAgentState(agentState: PersistedAgentState): Promise<void> {
		const current = await this.load();
		const agentStates = current?.agentStates ?? [];
		const existingIdx = agentStates.findIndex(a => a.role === agentState.role);
		if (existingIdx >= 0) {
			agentStates[existingIdx] = agentState;
		} else {
			agentStates.push(agentState);
		}
		await this.save({
			agentStates,
			lastSaved: Date.now()
		});
	}
}
