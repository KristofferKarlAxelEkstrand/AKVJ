#!/usr/bin/env node
import fs from 'node:fs';
import { getTrackedTextFiles } from './lib/gitTrackedTextFiles.js';
import { failWithOffenders } from './lib/report.js';

const shouldFix = process.argv.includes('--fix');

function normalizeToLF(content) {
	return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function main() {
	let files;
	try {
		files = getTrackedTextFiles();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}

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

	failWithOffenders(`Line ending check failed: found CRLF in ${offenders.length} file(s).`, offenders, 'Run: npm run fix:eol');
}

main();
