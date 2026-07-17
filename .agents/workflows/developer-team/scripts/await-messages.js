import fs from 'node:fs';
import path from 'node:path';

const dirs = process.argv.slice(2);
if (dirs.length === 0) {
    console.error('Usage: node await-messages.js <dir1> [dir2...]');
    process.exit(1);
}

// Validate directories exist
for (const dir of dirs) {
    const absDir = path.resolve(dir);
    if (!fs.existsSync(absDir)) {
        console.error(`Directory not found: ${absDir}`);
        process.exit(1);
    }
}

// State file for tracking seen files (prevents instant re-trigger on existing files)
const stateFile = path.resolve('.agents/workflows/developer-team/scripts/.await-state.json');
let seenFiles = new Map();

try {
    const raw = fs.readFileSync(stateFile, 'utf8');
    const parsed = JSON.parse(raw);
    seenFiles = new Map(Object.entries(parsed));
} catch {
    // No state file yet — first run, treat all existing files as seen (baseline)
}

function saveState() {
    try {
        fs.writeFileSync(stateFile, JSON.stringify(Object.fromEntries(seenFiles), null, 2));
    } catch {
        // Non-critical — don't block on state save errors
    }
}

function fileSignature(filePath) {
    try {
        const stat = fs.statSync(filePath);
        return `${stat.mtimeMs}:${stat.size}`;
    } catch {
        return null;
    }
}

function checkDirectories() {
    let foundNew = false;

    for (const dir of dirs) {
        const absDir = path.resolve(dir);

        try {
            const entries = fs.readdirSync(absDir, { withFileTypes: true });
            const files = entries
                .filter(e => e.isFile() && (e.name.endsWith('.md') || e.name.endsWith('.json')) && e.name !== 'README.md')
                .map(e => e.name);

            const newFiles = [];
            for (const file of files) {
                const fullPath = path.join(absDir, file);
                const sig = fileSignature(fullPath);
                const key = fullPath;
                const prevSig = seenFiles.get(key);

                if (sig !== null && sig !== prevSig) {
                    newFiles.push(file);
                    seenFiles.set(key, sig);
                }
            }

            if (newFiles.length > 0) {
                console.log(`\n========================================`);
                console.log(`MESSAGE(S) WAITING in ${dir}:`);
                newFiles.forEach(f => console.log(`- ${f}`));
                console.log(`========================================\n`);
                console.log(`Agent waking up to process messages...`);
                saveState();
                foundNew = true;
                break;
            }
        } catch (error) {
            console.error(`Error reading ${absDir}: ${error.message}`);
        }
    }

    if (foundNew) {
        process.exit(0);
    }
}

// 1. Check immediately on startup
checkDirectories();

console.log(`Listening for new messages. Polling directories: ${dirs.join(', ')}...`);

// 2. Poll every 2 seconds. This is 100% reliable across all OS filesystems.
setInterval(checkDirectories, 2000);

// Handle manual cancellation gracefully
process.on('SIGINT', () => {
    saveState();
    process.exit(0);
});
