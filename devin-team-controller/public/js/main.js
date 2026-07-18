// Standalone dashboard frontend — uses SSE + fetch.

const recentAgentOutput = [];
let teamRunning = false;
const MAX_RECENT_OUTPUT = 20;

const AGENT_ROLES = ['team-lead', 'akvj-developer', 'mainframe-developer', 'qa-reviewer', 'overseer', 'nitpicker', 'test-marshal', 'quartermaster'];

connectSSE();

// ── SSE connection ────────────────────────────────────────────────────────────

function connectSSE() {
	const es = new EventSource('/events');

	es.addEventListener('dashboard', e => renderDashboard(JSON.parse(e.data)));
	es.addEventListener('agent-update', e => renderAgentUpdate(JSON.parse(e.data)));
	es.addEventListener('activity', e => addTimelineEntry(JSON.parse(e.data)));
	es.addEventListener('agent-status', e => {
		const { role, status } = JSON.parse(e.data);
		const dot = document.querySelector(`.agent-card[data-role="${role}"] .status-dot`);
		if (dot) dot.className = `status-dot ${status}`;
	});
	es.addEventListener('team-status', e => {
		teamRunning = JSON.parse(e.data).running;
		updateTeamButtons();
	});
	es.addEventListener('file-change', e => {
		const { folder, filename } = JSON.parse(e.data);
		addTimelineEntry({ type: 'file', role: folder, detail: filename, timestamp: Date.now() });
	});
	es.onerror = () => setTimeout(connectSSE, 3000);
}

// ── API helpers ───────────────────────────────────────────────────────────────

async function apiPost(url, body) {
	const res = await fetch(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(body)
	});
	return res.json();
}

// ── Render ────────────────────────────────────────────────────────────────────

function renderDashboard(dashboard) {
	const app = document.getElementById('app');
	if (!app) return;

	const agentCards = dashboard.agents
		.map(agent => {
			const status = dashboard.poolStatus?.[agent.role]?.status ?? agent.status;
			const badges = agent.messages
				.slice(0, 3)
				.map(msg => `<span class="message-badge">${msg.prefix || 'MSG'}</span>`)
				.join('');
			const extra = agent.messageCount > 3 ? `<span class="message-badge">+${agent.messageCount - 3}</span>` : '';
			return `
<div class="agent-card" data-role="${agent.role}">
<span class="status-dot ${status}"></span>
<span class="agent-name">${agent.displayName}</span>
<span class="agent-model">${agent.model}</span>
<span class="agent-messages">${agent.messageCount > 0 ? agent.messageCount + ' msg' : ''}</span>
<div class="message-badges">${badges}${extra}</div>
</div>`;
		})
		.join('');

	const activeAgents = dashboard.agents.filter(a => a.status === 'has-messages').length;

	const tasks = dashboard.tasks.length
		? dashboard.tasks
				.map(
					task => `
<div class="task-item" data-filename="${task.filename}">
<div class="task-title">${escapeHtml(task.title)}</div>
<div class="task-meta">
<span class="task-priority ${task.priority}">${task.priority}</span>
<span class="task-status">${task.status}</span>
<span>${task.assignee !== 'none' ? '→ ' + task.assignee : 'unassigned'}</span>
</div>
</div>`
				)
				.join('')
		: '<div class="empty-state">No tasks in backlog</div>';

	app.innerHTML = `
<div class="team-controls">
<button class="team-btn start" id="startTeamBtn" ${teamRunning ? 'disabled' : ''}>▶ Start Team</button>
<button class="team-btn stop" id="stopTeamBtn" ${!teamRunning ? 'disabled' : ''}>■ Stop Team</button>
<button class="team-btn check" id="checkInboxBtn" ${!teamRunning ? 'disabled' : ''}>📬 Check Inbox</button>
</div>

<div class="summary-bar">
<div class="summary-item"><div class="summary-value">${activeAgents}</div><div class="summary-label">Active</div></div>
<div class="summary-item"><div class="summary-value">${dashboard.inboxCount}</div><div class="summary-label">Inbox</div></div>
<div class="summary-item"><div class="summary-value">${dashboard.tasks.length}</div><div class="summary-label">Tasks</div></div>
<div class="summary-item"><div class="summary-value">${dashboard.outboxCount}</div><div class="summary-label">Outbox</div></div>
</div>

<div class="section">
<div class="section-title">Agents <span class="count">${dashboard.agents.length}</span><div class="live-indicator"><div class="live-dot"></div><span>LIVE</span></div></div>
<div class="agent-grid">${agentCards}</div>
</div>

<div class="section">
<div class="section-title">Tasks <span class="count">${dashboard.tasks.length}</span></div>
<div class="task-list">${tasks}</div>
</div>

<div class="section">
<div class="section-title">Recent Agent Output</div>
<div class="recent-output" id="recentOutput"><div class="empty-state">No recent output</div></div>
</div>

<div class="section compose-section">
<div class="section-title">Compose</div>
<select id="composeRecipient" class="compose-select"><option value="">Select agent...</option>${AGENT_ROLES.map(r => `<option value="${r}">${r}</option>`).join('')}</select>
<textarea id="composeText" class="compose-text" placeholder="Type a message..." rows="3"></textarea>
<button class="team-btn" id="composeSendBtn">Send</button>
</div>

<div class="section">
<div class="section-title">Activity Timeline <span class="refresh-indicator" id="clearTimelineBtn">Clear</span></div>
<div class="timeline" id="timeline"></div>
</div>
`;

	attachEventListeners();
	updateTeamButtons();
}

function updateTeamButtons() {
	for (const [id, disabled] of [
		['startTeamBtn', teamRunning],
		['stopTeamBtn', !teamRunning],
		['checkInboxBtn', !teamRunning]
	]) {
		const btn = document.getElementById(id);
		if (btn) {
			btn.disabled = disabled;
			btn.style.opacity = disabled ? '0.5' : '1';
		}
	}
}

function renderAgentUpdate({ role, update }) {
	let outputText = '';
	const type = update.sessionUpdate ?? 'unknown';
	if (type === 'agent_message_chunk') outputText = update.content?.text ?? '';
	else if (type === 'tool_call') outputText = `🔧 ${update.title ?? 'Tool call'}`;
	else if (type === 'agent_done') outputText = '✓ Done';
	else if (type === 'agent_error') outputText = `✗ Error: ${update.title ?? ''}`;

	if (!outputText) return;

	recentAgentOutput.unshift({ role, text: outputText, timestamp: Date.now() });
	if (recentAgentOutput.length > MAX_RECENT_OUTPUT) recentAgentOutput.pop();
	updateRecentOutputDisplay();
}

function updateRecentOutputDisplay() {
	const container = document.getElementById('recentOutput');
	if (!container) return;
	container.innerHTML = recentAgentOutput
		.map(
			item => `
<div class="recent-output-item">
<span class="recent-output-role">${item.role}</span>
<span class="recent-output-text">${escapeHtml(item.text.slice(0, 200))}${item.text.length > 200 ? '...' : ''}</span>
<span class="recent-output-time">${formatTime(item.timestamp)}</span>
</div>`
		)
		.join('');
}

function addTimelineEntry(event) {
	const timeline = document.getElementById('timeline');
	if (!timeline) return;
	const entry = document.createElement('div');
	entry.className = `timeline-entry timeline-${event.type}`;
	const time = new Date(event.timestamp ?? Date.now()).toLocaleTimeString();
	entry.innerHTML = `<span class="timeline-time">${time}</span> <span class="timeline-role">${escapeHtml(event.role ?? '')}</span> <span class="timeline-type">${event.type}</span> <span class="timeline-detail">${escapeHtml(event.detail ?? '')}</span>`;
	timeline.insertBefore(entry, timeline.firstChild);
	while (timeline.children.length > 100) timeline.removeChild(timeline.lastChild);
}

// ── Event handling ────────────────────────────────────────────────────────────

function attachEventListeners() {
	document.getElementById('startTeamBtn')?.addEventListener('click', async () => {
		const result = await apiPost('/api/start', {});
		if (!result.ok) alert('Start failed: ' + result.error);
	});

	document.getElementById('stopTeamBtn')?.addEventListener('click', async () => {
		const result = await apiPost('/api/stop', {});
		if (!result.ok) alert('Stop failed: ' + result.error);
	});

	document.getElementById('checkInboxBtn')?.addEventListener('click', async () => {
		const result = await apiPost('/api/check-inbox', {});
		if (!result.ok) alert('Check inbox failed: ' + result.error);
		else alert(result.message || 'Inbox check triggered');
	});

	document.getElementById('composeSendBtn')?.addEventListener('click', async () => {
		const role = document.getElementById('composeRecipient')?.value;
		const text = document.getElementById('composeText')?.value;
		if (role && text) {
			const result = await apiPost('/api/compose', { role, text });
			if (result.ok) document.getElementById('composeText').value = '';
			else alert('Send failed: ' + result.error);
		}
	});

	document.getElementById('clearTimelineBtn')?.addEventListener('click', () => {
		const timeline = document.getElementById('timeline');
		if (timeline) timeline.innerHTML = '';
	});
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function formatTime(timestamp) {
	const diff = Date.now() - timestamp;
	if (diff < 60_000) return 'just now';
	if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
	if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
	return `${Math.floor(diff / 86_400_000)}d ago`;
}

function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = String(text);
	return div.innerHTML;
}
