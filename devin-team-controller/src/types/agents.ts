export type AgentRole = 'team-lead' | 'akvj-developer' | 'mainframe-developer' | 'qa-reviewer' | 'overseer' | 'nitpicker' | 'test-marshal' | 'quartermaster';

export interface McpEnvVar {
	name: string;
	value: string;
}

export interface McpServerConfig {
	type: 'stdio';
	name: string;
	command: string;
	args: string[];
	env?: McpEnvVar[];
}

export interface AgentConfig {
	role: AgentRole;
	displayName: string;
	model: string;
	permissionMode: string;
	enabled: boolean;
	triggerType: 'file' | 'timer';
	timerIntervalMinMs?: number;
	timerIntervalMaxMs?: number;
	promptFile: string;
	mcpServers?: McpServerConfig[];
}

export const AGENT_CONFIGS: AgentConfig[] = [
	{
		role: 'team-lead',
		displayName: 'Team Lead',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'file',
		promptFile: 'team-lead.prompt.md'
	},
	{
		role: 'akvj-developer',
		displayName: 'AKVJ Developer',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'file',
		promptFile: 'akvj-developer.prompt.md'
	},
	{
		role: 'mainframe-developer',
		displayName: 'Mainframe Developer',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'file',
		promptFile: 'mainframe-developer.prompt.md'
	},
	{
		role: 'qa-reviewer',
		displayName: 'QA Reviewer',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'file',
		promptFile: 'qa-reviewer.prompt.md'
	},
	{
		role: 'overseer',
		displayName: 'Overseer',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'timer',
		timerIntervalMinMs: 10 * 60 * 1000,
		timerIntervalMaxMs: 20 * 60 * 1000,
		promptFile: 'overseer.prompt.md'
	},
	{
		role: 'nitpicker',
		displayName: 'Nitpicker',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'timer',
		timerIntervalMinMs: 10 * 60 * 1000,
		timerIntervalMaxMs: 20 * 60 * 1000,
		promptFile: 'nitpicker.prompt.md'
	},
	{
		role: 'test-marshal',
		displayName: 'Test Marshal',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'timer',
		timerIntervalMinMs: 10 * 60 * 1000,
		timerIntervalMaxMs: 20 * 60 * 1000,
		promptFile: 'test-marshal.prompt.md'
	},
	{
		role: 'quartermaster',
		displayName: 'Quartermaster',
		model: 'SWE-1.6',
		permissionMode: 'dangerous',
		enabled: true,
		triggerType: 'timer',
		timerIntervalMinMs: 10 * 60 * 1000,
		timerIntervalMaxMs: 20 * 60 * 1000,
		promptFile: 'quartermaster.prompt.md'
	}
];
