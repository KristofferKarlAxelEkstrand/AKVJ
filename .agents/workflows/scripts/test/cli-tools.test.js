import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

/**
 * One place knows which binary a CLI installs as.
 *
 * control-center and run-team both source lib/cli-tools.sh and then each grew
 * their own byte-for-byte copy of its product → binary case statement — plus a
 * third inline `find` for devin. Adding a CLI meant editing three places, and
 * missing one meant the panel showed a tool the launcher could not find.
 *
 * These are text assertions on purpose: the failure mode is a copy reappearing,
 * which no behavioural test would catch while both copies still agree.
 */

const SCRIPTS_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

const read = name => fs.readFileSync(path.join(SCRIPTS_DIR, name), 'utf8');

/** Binary names that differ from the product name, plus devin's install root. */
const BINARY_STRINGS = ['cursor-agent', 'agy', '.devin-server'];

describe('CLI binary mapping', () => {
    it.each(BINARY_STRINGS)('names %s only in lib/cli-tools.sh', needle => {
        for (const script of ['control-center', 'run-team']) {
            expect(read(script), `${script} should ask cli_tools_bin, not resolve "${needle}" itself`).not.toContain(needle);
        }
        expect(read('lib/cli-tools.sh')).toContain(needle);
    });

    it('leaves no second resolver defined in the consumers', () => {
        expect(read('control-center')).not.toMatch(/^cli_path\(\)/m);
        expect(read('run-team')).not.toMatch(/^cli_bin\(\)/m);
        // The cached-path globals cli_bin read from went with it.
        expect(read('run-team')).not.toMatch(/\b(DEVIN|CLAUDE|COPILOT|ANTIGRAVITY)_BIN\b/);
    });

    it('resolves every known CLI without erroring', () => {
        // A typo'd case arm returns empty rather than failing, so assert the
        // function runs clean for each name the catalog and panel iterate.
        const script = `
            source "${path.join(SCRIPTS_DIR, 'lib/cli-tools.sh')}"
            for cli in "\${CLI_TOOLS_KNOWN[@]}"; do
                cli_tools_bin "$cli" >/dev/null || exit 1
                echo "$cli"
            done
        `;
        const listed = execFileSync('bash', ['-c', script], { encoding: 'utf8' }).trim().split('\n');

        expect(listed).toEqual(['claude', 'devin', 'copilot', 'cursor', 'antigravity']);
    });

    it('names every install command only in lib/cli-tools.sh', () => {
        // run-team said these once as error hints and control-center said them
        // again inside five interactive installer blocks.
        for (const needle of ['@anthropic-ai/claude-code', '@github/copilot', 'antigravity.google/cli/install', 'cursor.com/install', 'app.devin.ai']) {
            for (const script of ['control-center', 'run-team']) {
                expect(read(script), `${script} should ask cli_tools_install_*, not repeat "${needle}"`).not.toContain(needle);
            }
            expect(read('lib/cli-tools.sh')).toContain(needle);
        }
    });

    it('leaves no second installer in the consumers', () => {
        expect(read('run-team')).not.toMatch(/^cli_install_hint\(\)/m);
        // The control center prints install commands now; it does not run them.
        expect(read('control-center')).not.toMatch(/^run_install\(\)/m);
    });

    it('gives every known CLI an install hint', () => {
        // An empty arm would render "binary was not found — " with nothing after
        // the dash, which is exactly when a human most needs the text.
        const script = `
            source "${path.join(SCRIPTS_DIR, 'lib/cli-tools.sh')}"
            for cli in "\${CLI_TOOLS_KNOWN[@]}"; do
                hint=$(cli_tools_install_hint "$cli")
                [ -n "$hint" ] || { echo "empty hint for $cli" >&2; exit 1; }
                echo "$cli: $hint"
            done
        `;
        const hints = execFileSync('bash', ['-c', script], { encoding: 'utf8' });

        expect(hints).toContain('claude: npm install -g @anthropic-ai/claude-code');
        // devin cannot be scripted, so its hint is the note, not a command.
        expect(hints).toContain('devin: install it from https://app.devin.ai/settings/devin-cli');
    });

    it('marks devin as the one CLI with no install command', () => {
        const probe = field => execFileSync('bash', ['-c', `source "${path.join(SCRIPTS_DIR, 'lib/cli-tools.sh')}"; cli_tools_install_${field} devin`], { encoding: 'utf8' }).trim();

        expect(probe('command')).toBe('');
        expect(probe('note')).not.toBe('');
    });

    it('keeps run-team launchable set inside the known set', () => {
        const known = execFileSync('bash', ['-c', `source "${path.join(SCRIPTS_DIR, 'lib/cli-tools.sh')}"; echo "\${CLI_TOOLS_KNOWN[@]}"`], { encoding: 'utf8' }).trim().split(/\s+/);
        const supported = /^SUPPORTED_CLIS=\(([^)]*)\)/m.exec(read('run-team'))[1].split(/\s+/);

        // A CLI run-team will launch but the lib cannot locate is unlaunchable.
        expect(known).toEqual(expect.arrayContaining(supported));
    });
});
