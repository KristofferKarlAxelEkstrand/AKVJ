import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * Build a throwaway workflow tree and run the real scripts against it.
 *
 * These scripts read and write a live directory layout and are launched by a
 * bash orchestrator, so testing them through their actual CLI against a real
 * tree exercises what production does. The scripts derive the repo root from
 * their own location (`scripts/root.js`), so the fixture copies them into a
 * matching `.agents/workflows/scripts/` inside a temp directory.
 */

const SOURCE_SCRIPTS_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');

export class WorkflowTree {
    /** @param {string} [workflowName] */
    constructor(workflowName = 'test-team') {
        this.workflow = workflowName;
        this.rootDir = fs.mkdtempSync(path.join(os.tmpdir(), 'akvj-workflow-'));
        this.scriptsDir = path.join(this.rootDir, '.agents/workflows/scripts');
        this.workflowDir = path.join(this.rootDir, '.agents/workflows', workflowName);

        fs.mkdirSync(this.scriptsDir, { recursive: true });
        fs.cpSync(SOURCE_SCRIPTS_DIR, this.scriptsDir, {
            recursive: true,
            filter: source => !source.includes('node_modules') && !source.includes(`${path.sep}test${path.sep}`) && !source.endsWith('/test')
        });

        for (const dir of [
            'co-workers/_shared',
            'mail/in/read',
            'mail/out',
            'tasks/todo',
            'tasks/working-on',
            'tasks/done',
            'slack/general',
            'slack/quarantine',
            'slack/all',
            'health/heartbeats',
            'health/restart-requests',
            'health/awaiting',
            'memory',
            '.temp'
        ]) {
            fs.mkdirSync(path.join(this.workflowDir, dir), { recursive: true });
        }
    }

    /** Absolute path inside the workflow directory. */
    path(...parts) {
        return path.join(this.workflowDir, ...parts);
    }

    /** Write a file, creating parent directories. */
    write(relativePath, content) {
        const full = this.path(relativePath);
        fs.mkdirSync(path.dirname(full), { recursive: true });
        fs.writeFileSync(full, content);
        return full;
    }

    read(relativePath) {
        return fs.readFileSync(this.path(relativePath), 'utf8');
    }

    exists(relativePath) {
        return fs.existsSync(this.path(relativePath));
    }

    list(relativePath) {
        try {
            return fs.readdirSync(this.path(relativePath)).sort();
        } catch {
            return [];
        }
    }

    /** Backdate a file so age-based logic sees it as old. */
    age(relativePath, minutes) {
        const when = new Date(Date.now() - minutes * 60_000);
        fs.utimesSync(this.path(relativePath), when, when);
    }

    /** Register an agent with a config and a role prompt. */
    addAgent(name, { config = {}, prompt = `# ${name}\n\nRole body.\n`, slack = true } = {}) {
        this.write(`co-workers/${name}.prompt.json`, JSON.stringify({ display: name, ...config }, null, 2));
        this.write(`co-workers/${name}.prompt.md`, prompt);
        if (slack) {
            fs.mkdirSync(this.path('slack', name), { recursive: true });
        }
    }

    addPartial(name, content) {
        this.write(`co-workers/_shared/${name}.md`, content);
    }

    /**
     * Run a workflow script's CLI.
     *
     * A throwaway tree has no tmux session, and liveness treats a missing
     * session as decisive — so the default here says the session is up, and a
     * test that cares about a stopped team passes `AKVJ_HEALTH_SESSION: '0'`.
     *
     * @returns {{stdout: string, status: number}}
     */
    run(scriptName, args = [], env = {}) {
        try {
            const stdout = execFileSync('node', [path.join(this.scriptsDir, scriptName), ...args], {
                encoding: 'utf8',
                stdio: ['ignore', 'pipe', 'pipe'],
                env: { ...process.env, AKVJ_HEALTH_SESSION: '1', ...env }
            });
            return { stdout, status: 0 };
        } catch (error) {
            return { stdout: `${error.stdout || ''}${error.stderr || ''}`, status: error.status ?? 1 };
        }
    }

    cleanup() {
        fs.rmSync(this.rootDir, { recursive: true, force: true });
    }
}

/**
 * A message file with a valid envelope.
 * @returns {string}
 */
export function message({ type = 'task', from = 'team-lead', to, task, body = 'Do the thing.' } = {}) {
    const lines = ['---', `type: ${type}`, `from: ${from}`];
    if (to) {
        lines.push(`to: ${to}`);
    }
    if (task) {
        lines.push(`task: ${task}`);
    }
    lines.push(`created: ${new Date().toISOString()}`, '---', '', body, '');
    return lines.join('\n');
}

/**
 * A task file with kanban frontmatter.
 * @returns {string}
 */
export function taskFile({ status = 'backlog', assignee = 'none', priority = 'medium', title = 'A task' } = {}) {
    return `---\nstatus: ${status}\nassignee: ${assignee}\npriority: ${priority}\n---\n\n# ${title}\n\nDetails.\n`;
}
