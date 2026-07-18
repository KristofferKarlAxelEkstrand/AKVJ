#!/usr/bin/env node
import fs from 'node:fs';
import { TextDecoder } from 'node:util';
import { getTrackedTextFiles } from './lib/gitTrackedTextFiles.js';
import { failWithOffenders } from './lib/report.js';

const shouldFix = process.argv.includes('--fix');
const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function hasUtf8Bom(buffer) {
	return buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
}

function main() {
	let files;
	try {
		files = getTrackedTextFiles();
	} catch (error) {
		console.error(error.message);
		process.exit(1);
	}

	const bomFiles = [];
	const invalidFiles = [];

	for (const file of files) {
		let buffer;
		try {
			buffer = fs.readFileSync(file);
		} catch {
			continue;
		}

		if (hasUtf8Bom(buffer)) {
			bomFiles.push(file);
			if (shouldFix) {
				fs.writeFileSync(file, buffer.subarray(3));
				buffer = fs.readFileSync(file);
			}
		}

		try {
			utf8Decoder.decode(buffer);
		} catch {
			invalidFiles.push(file);
		}
	}

	if (shouldFix && bomFiles.length > 0) {
		console.log(`Removed UTF-8 BOM from ${bomFiles.length} file(s).`);
	}

	if (invalidFiles.length === 0 && bomFiles.length === 0) {
		console.log('UTF-8 check passed: all tracked text files are valid UTF-8 without BOM.');
		return;
	}

	if (!shouldFix) {
		if (bomFiles.length > 0) {
			console.error(`UTF-8 check failed: found UTF-8 BOM in ${bomFiles.length} file(s).`);
			for (const file of bomFiles) {
				console.error(`- ${file}`);
			}
		}
		if (invalidFiles.length > 0) {
			console.error(`UTF-8 check failed: found invalid UTF-8 in ${invalidFiles.length} file(s).`);
			for (const file of invalidFiles) {
				console.error(`- ${file}`);
			}
		}
		console.error('Run: npm run fix:utf8');
		process.exit(1);
	}

	if (invalidFiles.length > 0) {
		failWithOffenders(`UTF-8 fix could not auto-repair ${invalidFiles.length} invalid file(s):`, invalidFiles, 'Please re-save these files as UTF-8 manually.');
	}

	if (bomFiles.length > 0) {
		console.log('UTF-8 fix completed: all tracked text files are valid UTF-8 without BOM.');
	}
}

main();
