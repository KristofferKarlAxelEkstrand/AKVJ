import { execSync } from 'node:child_process';
import fs from 'node:fs';

const shouldFix = process.argv.includes('--fix');

function getTrackedTextFiles() {
	const output = execSync('git grep -Il ""', { encoding: 'utf8' });
	return output
		.split('\n')
		.map(line => line.trim())
		.filter(Boolean);
}

function normalizeToLF(content) {
	return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function main() {
	const files = getTrackedTextFiles();
	const offenders = [];

	for (const file of files) {
		let content;
		try {
			content = fs.readFileSync(file, 'utf8');
		} catch {
			continue;
		}

		if (!content.includes('\r')) {
			continue;
		}

		offenders.push(file);
		if (shouldFix) {
			fs.writeFileSync(file, normalizeToLF(content), 'utf8');
		}
	}

	if (offenders.length === 0) {
		console.log('Line ending check passed: no CRLF found.');
		return;
	}

	if (shouldFix) {
		console.log(`Normalized line endings to LF in ${offenders.length} file(s).`);
		return;
	}

	console.error(`Line ending check failed: found CRLF in ${offenders.length} file(s).`);
	for (const file of offenders) {
		console.error(`- ${file}`);
	}
	console.error('Run: npm run fix:eol');
	process.exit(1);
}

main();
