import type { AgentRole } from '../types/agents.js';

type TimerCallback = (role: AgentRole) => void;

interface TimerEntry {
	timeout: NodeJS.Timeout;
	intervalMinMs: number;
	intervalMaxMs: number;
}

export class TimerService {
	#timers: Map<AgentRole, TimerEntry> = new Map();
	#callback: TimerCallback;

	constructor(callback: TimerCallback) {
		this.#callback = callback;
	}

	startAgent(role: AgentRole, intervalMinMs: number, intervalMaxMs: number): void {
		this.stopAgent(role);
		this.#scheduleNext(role, intervalMinMs, intervalMaxMs);
	}

	stopAgent(role: AgentRole): void {
		const entry = this.#timers.get(role);
		if (entry) {
			clearTimeout(entry.timeout);
			this.#timers.delete(role);
		}
	}

	stopAll(): void {
		for (const entry of this.#timers.values()) {
			clearTimeout(entry.timeout);
		}
		this.#timers.clear();
	}

	#scheduleNext(role: AgentRole, intervalMinMs: number, intervalMaxMs: number): void {
		const delay = this.#randomInterval(intervalMinMs, intervalMaxMs);
		const timeout = setTimeout(() => {
			this.#callback(role);
			this.#scheduleNext(role, intervalMinMs, intervalMaxMs);
		}, delay);
		this.#timers.set(role, { timeout, intervalMinMs, intervalMaxMs });
	}

	#randomInterval(minMs: number, maxMs: number): number {
		return Math.floor(minMs + Math.random() * (maxMs - minMs));
	}
}
