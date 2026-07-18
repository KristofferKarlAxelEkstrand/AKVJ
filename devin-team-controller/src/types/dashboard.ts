export interface DashboardMessage {
	filename: string;
	path: string;
	prefix: string;
	modifiedTime: number;
}

export interface DashboardAgent {
	role: string;
	displayName: string;
	model: string;
	status: string;
	messageCount: number;
	messages: DashboardMessage[];
}

export interface DashboardTask {
	filename: string;
	title: string;
	status: string;
	assignee: string;
	priority: string;
	modifiedTime: number;
}

export interface DashboardData {
	agents: DashboardAgent[];
	tasks: DashboardTask[];
	inboxCount: number;
	outboxCount: number;
	generatedAt: number;
	poolStatus: Record<string, { status: string }>;
}
