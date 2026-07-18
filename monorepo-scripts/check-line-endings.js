#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getTrackedTextFiles } from './lib/gitTrackedTextFiles.js';
import { failWithOffenders } from './lib/report.js';

/**
 * Normalize CR/CRLF line endings to LF.
 * @param {string} content
 * @returns {string}
 */
export function normalizeToLF(content) {
	return content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

function main() {
	const shouldFix = process.argv.includes('--fix');
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

const scriptPath = process.argv[1] ?? '';
const isCli = scriptPath && path.resolve(scriptPath) === fileURLToPath(import.meta.url);

if (isCli) {
	main();
}
