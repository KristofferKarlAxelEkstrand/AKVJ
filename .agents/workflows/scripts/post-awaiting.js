import fs from 'node:fs';
import path from 'node:path';
import { REPO_ROOT } from './root.js';

const args = process.argv.slice(2);
if (args.length < 3) {
    console.error('Usage: node post-awaiting.js <workflow> <agent> "<waitingOn>[, ...]" [reason]');
    console.error('       node post-awaiting.js <workflow> <agent> --clear');
    process.exit(1);
}

const [workflow, agent, ...rest] = args;
const awaitingDir = path.join(REPO_ROOT, '.agents/workflows', workflow, 'health', 'awaiting');
const awaitingFile = path.join(awaitingDir, `${agent}.json`);

if (rest[0] === '--clear') {
    try {
        if (fs.existsSync(awaitingFile)) {
            fs.rmSync(awaitingFile);
            console.log(`[awaiting] cleared for ${agent}`);
        } else {
            console.log(`[awaiting] no status to clear for ${agent}`);
        }
    } catch (error) {
        console.error(`[awaiting] failed to clear ${awaitingFile}: ${error.message}`);
        process.exit(1);
    }
    process.exit(0);
}

const waitingOnRaw = rest.shift();
const reason = rest.join(' ').trim();
const waitingOn = waitingOnRaw.split(',').map(s => s.trim()).filter(Boolean);
if (waitingOn.length === 0) {
    console.error('Error: waitingOn must contain at least one value');
    process.exit(1);
}

const data = {
    agent,
    waitingOn,
    reason,
    since: Date.now()
};

try {
    fs.mkdirSync(awaitingDir, { recursive: true });
    fs.writeFileSync(awaitingFile, JSON.stringify(data, null, 2));
    const reasonText = reason ? `: ${reason}` : '';
    console.log(`[awaiting] ${agent} is awaiting ${waitingOn.join(', ')}${reasonText}`);
} catch (error) {
    console.error(`[awaiting] failed to write ${awaitingFile}: ${error.message}`);
    process.exit(1);
}
