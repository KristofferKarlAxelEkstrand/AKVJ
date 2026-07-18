import { EventEmitter } from 'node:events';
import type { AgentRole } from '../types/agents.js';
import type { AgentStatus } from '../agents/AcpClientPool.js';
import type { DashboardData } from '../types/dashboard.js';

export interface AgentActivityEvent {
	type: 'activity';
	role: AgentRole;
	activityType: 'started' | 'stopped' | 'crashed' | 'prompt_sent' | 'prompt_completed' | 'prompt_failed' | 'restarting';
	detail: string;
	timestamp: number;
}

export interface AgentStatusEvent {
	type: 'agent-status';
	role: AgentRole;
	status: AgentStatus;
}

export interface AgentUpdateEvent {
	type: 'agent-update';
	role: AgentRole;
	update: unknown;
}

export interface TeamStatusEvent {
	type: 'team-status';
	running: boolean;
}

export interface FileChangeEvent {
	type: 'file-change';
	folder: string;
	filename: string;
}

export interface DashboardEvent {
	type: 'dashboard';
	dashboard: DashboardData;
}

export type ApplicationEvent = AgentActivityEvent | AgentStatusEvent | AgentUpdateEvent | TeamStatusEvent | FileChangeEvent | DashboardEvent;

export class ApplicationEventBus extends EventEmitter {
	emitEvent(event: ApplicationEvent): boolean {
		return this.emit(event.type, event);
	}

	onActivity(handler: (event: AgentActivityEvent) => void): void {
		this.on('activity', handler);
	}

	onStatusChange(handler: (event: AgentStatusEvent) => void): void {
		this.on('agent-status', handler);
	}

	onUpdate(handler: (event: AgentUpdateEvent) => void): void {
		this.on('agent-update', handler);
	}

	onTeamStatus(handler: (event: TeamStatusEvent) => void): void {
		this.on('team-status', handler);
	}

	onFileChange(handler: (event: FileChangeEvent) => void): void {
		this.on('file-change', handler);
	}

	onDashboard(handler: (event: DashboardEvent) => void): void {
		this.on('dashboard', handler);
	}
}
