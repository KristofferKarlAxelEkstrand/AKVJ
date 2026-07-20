import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT, DEFAULT_WORKFLOW } from './root.js';
import { splitFrontmatter } from './lib/frontmatter.js';
import { parseMessage, resolveOwner, listMessageFiles } from './lib/message.js';

const rawArgs = process.argv.slice(2);
const workflow = rawArgs[0] || DEFAULT_WORKFLOW;
const COOLDOWN_SECONDS = Number(rawArgs[1] || process.env.RESTART_COOLDOWN_SECONDS || 120);
const STALLED_SECONDS = Number(rawArgs[2] || process.env.STALLED_WORK_SECONDS || 600);

const WORKFLOW_ROOT = path.join(REPO_ROOT, '.agents/workflows', workflow);
const MAIL_IN_DIR = path.join(WORKFLOW_ROOT, 'mail/in');
const TASKS_TODO_DIR = path.join(WORKFLOW_ROOT, 'tasks/todo');
const TASKS_WORKING_ON_DIR = path.join(WORKFLOW_ROOT, 'tasks/working-on');
const RESTART_REQUEST_DIR = path.join(WORKFLOW_ROOT, 'health/restart-requests');
const STATE_FILE = path.join(WORKFLOW_ROOT, '.temp', 'stalled-restart-state.json');

const STALLED_MS = STALLED_SECONDS * 1000;
const COOLDOWN_MS = COOLDOWN_SECONDS * 1000;

/**
 * Read a task file's frontmatter (tasks carry status/assignee/priority, not a
 * message envelope).
 *
 * @param {string} filePath
 * @returns {Record<string, string | string[]>}
 */
function readTaskFrontmatter(filePath) {
	try {
		return splitFrontmatter(fs.readFileSync(filePath, 'utf8')).data;
	} catch {
		return {};
	}
}

function getFileAgeMs(filePath) {
	try {
		const stat = fs.statSync(filePath);
		return Date.now() - stat.mtimeMs;
	} catch {
		return 0;
	}
}

const listMdFiles = listMessageFiles;

function normalizeSubject(fileName) {
	return fileName
		.replace(/\.md$/, '')
		.replace(/^\[[^\]]+\]-/, '')
		.replace(/-\d{4}-\d{2}-\d{2}(-\d+)?$/, '')
		.toLowerCase();
}

function normalizeWorkingOnSubject(fileName) {
	return fileName
		.replace(/\.md$/, '')
		.replace(/^\d+-/, '')
		.replace(/-\d{4}-\d{2}-\d{2}(-\d+)?$/, '')
		.toLowerCase();
}

function hasCorrespondingWorkingOnTask(mailFileName) {
	const mailSlug = normalizeSubject(mailFileName);
	if (!mailSlug) {
		return false;
	}

	for (const workingOnFile of listMdFiles(TASKS_WORKING_ON_DIR)) {
		const workingOnSlug = normalizeWorkingOnSubject(path.basename(workingOnFile));
		if (workingOnSlug === mailSlug || workingOnSlug.includes(mailSlug) || mailSlug.includes(workingOnSlug)) {
			return true;
		}
	}
	return false;
}

/**
 * @typedef {Object} StalledState
 * @property {Record<string, number>} agents  Agent name -> timestamp of last restart request.
 * @property {Record<string, {sig: string, nudges: number}>} files  Watched file -> nudge bookkeeping.
 */

/** @returns {StalledState} */
function readState() {
	try {
		const parsed = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
		return {
			agents: parsed.agents && typeof parsed.agents === 'object' ? parsed.agents : {},
			files: parsed.files && typeof parsed.files === 'object' ? parsed.files : {}
		};
	} catch {
		return { agents: {}, files: {} };
	}
}

/** @param {StalledState} state */
function writeState(state) {
	try {
		fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
		fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
	} catch {
		// Non-critical
	}
}

/**
 * Identity of a file's current contents, so a file that gets edited (or replaced
 * by a same-named one) counts as a fresh item worth nudging about again.
 *
 * @param {string} filePath
 * @returns {string}
 */
function fileSignature(filePath) {
	try {
		const stat = fs.statSync(filePath);
		return `${stat.mtimeMs}:${stat.size}`;
	} catch {
		return '';
	}
}

/** Drop bookkeeping for files that have since been handled. */
function pruneMissingFiles(state) {
	for (const filePath of Object.keys(state.files)) {
		if (!fs.existsSync(filePath)) {
			delete state.files[filePath];
		}
	}
}

/**
 * Ask the monitor to restart the agent that owns a stalled item.
 *
 * Deliberately **one nudge per item**, not a repeating timer. A restart only
 * helps when an agent missed its wake; if the item is still there afterwards the
 * agent is choosing not to act on it, and restarting again every cooldown just
 * interrupts whatever it is doing instead. Since a non-empty backlog is the
 * normal state of this team, a repeating nudge is indistinguishable from a
 * restart loop — which is exactly what the previous inline implementation did.
 *
 * @param {string} agent
 * @param {string} reason
 * @param {string} filePath
 */
function nudgeAgent(agent, reason, filePath) {
	const now = Date.now();
	const state = readState();
	pruneMissingFiles(state);

	const baseName = path.basename(filePath);
	const signature = fileSignature(filePath);
	const previous = state.files[filePath];

	if (previous && previous.sig === signature && previous.nudges > 0) {
		console.log(`Already nudged ${agent} about ${baseName}; still unhandled but not restarting again.`);
		writeState(state);
		return;
	}

	const lastRequest = state.agents[agent] || 0;
	if (now - lastRequest < COOLDOWN_MS) {
		console.log(`Cooldown active for ${agent} (${Math.round((now - lastRequest) / 1000)}s since last request). Skipping ${reason}.`);
		writeState(state);
		return;
	}

	fs.mkdirSync(RESTART_REQUEST_DIR, { recursive: true });
	fs.writeFileSync(
		path.join(RESTART_REQUEST_DIR, `${agent}.json`),
		JSON.stringify({ reason, file: baseName, timestamp: now }, null, 2)
	);

	state.agents[agent] = now;
	state.files[filePath] = { sig: signature, nudges: (previous?.nudges || 0) + 1 };
	writeState(state);
	console.log(`Restart request for ${agent}: ${reason} — ${baseName}`);
}

function processStalledMail() {
	for (const mailFile of listMdFiles(MAIL_IN_DIR)) {
		if (getFileAgeMs(mailFile) <= STALLED_MS) {
			continue;
		}

		const baseName = path.basename(mailFile);
		if (hasCorrespondingWorkingOnTask(baseName)) {
			continue;
		}

		// The envelope names the recipient; untriaged mail belongs to the Team Lead.
		nudgeAgent(resolveOwner(parseMessage(mailFile)), 'stalled mail', mailFile);
	}
}

function resolveAgentFromAssignee(assignee) {
	if (!assignee || assignee === 'none') {
		return null;
	}
	return assignee;
}

function processStalledTasks() {
	for (const taskFile of listMdFiles(TASKS_TODO_DIR)) {
		if (getFileAgeMs(taskFile) <= STALLED_MS) {
			continue;
		}

		const frontmatter = readTaskFrontmatter(taskFile);
		const baseName = path.basename(taskFile);
		const assignedAgent = resolveAgentFromAssignee(frontmatter.assignee);
		if (!assignedAgent) {
			continue;
		}

		const workingOnPath = path.join(TASKS_WORKING_ON_DIR, baseName);
		if (fs.existsSync(workingOnPath)) {
			continue;
		}

		nudgeAgent(assignedAgent, 'stalled todo task', taskFile);
	}
}

processStalledMail();
processStalledTasks();
