import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { StateStore } from '../../src/core/StateStore.js';
import type { AgentRole } from '../../src/types/agents.js';
import { join } from 'node:path';
import { mkdtempSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';

describe('StateStore', () => {
	let tempDir: string;
	let stateStore: StateStore;

	beforeEach(() => {
		tempDir = mkdtempSync(join(tmpdir(), 'state-store-test-'));
		stateStore = new StateStore(tempDir);
	});

	afterEach(() => {
		rmSync(tempDir, { recursive: true, force: true });
	});

	it('returns null when no state file exists', async () => {
		const result = await stateStore.load();
		expect(result).toBeNull();
	});

	it('saves and loads agent state', async () => {
		await stateStore.saveAgentState({
			role: 'team-lead' as AgentRole,
			sessionId: 'sess-001',
			model: 'SWE-1.6',
			enabled: true
		});

		const result = await stateStore.load();
		expect(result).not.toBeNull();
		expect(result!.agentStates).toHaveLength(1);
		expect(result!.agentStates[0].role).toBe('team-lead');
		expect(result!.agentStates[0].sessionId).toBe('sess-001');
		expect(result!.agentStates[0].model).toBe('SWE-1.6');
	});

	it('updates existing agent state on re-save', async () => {
		await stateStore.saveAgentState({
			role: 'overseer' as AgentRole,
			sessionId: 'sess-001',
			model: 'SWE-1.6',
			enabled: true
		});

		await stateStore.saveAgentState({
			role: 'overseer' as AgentRole,
			sessionId: 'sess-002',
			model: 'SWE-1.6',
			enabled: false
		});

		const result = await stateStore.load();
		expect(result!.agentStates).toHaveLength(1);
		expect(result!.agentStates[0].sessionId).toBe('sess-002');
		expect(result!.agentStates[0].model).toBe('SWE-1.6');
		expect(result!.agentStates[0].enabled).toBe(false);
	});

	it('persists multiple agents', async () => {
		await stateStore.saveAgentState({
			role: 'team-lead' as AgentRole,
			sessionId: 'sess-001',
			model: 'SWE-1.6',
			enabled: true
		});
		await stateStore.saveAgentState({
			role: 'akvj-developer' as AgentRole,
			sessionId: 'sess-002',
			model: 'SWE-1.6',
			enabled: true
		});

		const result = await stateStore.load();
		expect(result!.agentStates).toHaveLength(2);
	});

	it('creates state directory if it does not exist', async () => {
		const stateDir = join(tempDir, '.agents', 'workflows', 'developer-team', 'memory');
		const stateFile = join(stateDir, 'server-state.json');
		expect(existsSync(stateDir)).toBe(false);
		expect(existsSync(stateFile)).toBe(false);

		await stateStore.saveAgentState({
			role: 'team-lead' as AgentRole,
			sessionId: 'sess-001',
			model: 'SWE-1.6',
			enabled: true
		});

		expect(existsSync(stateDir)).toBe(true);
		expect(existsSync(stateFile)).toBe(true);
	});
});
