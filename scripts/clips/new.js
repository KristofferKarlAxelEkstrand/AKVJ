#!/usr/bin/env node

/**
 * Clip Scaffolding Tool
 *
 * Creates a new clip slot with a template meta.json file.
 *
 * Usage:
 *   node scripts/clips/new.js <channel> <note> <velocity>
 *
 * Example:
 *   node scripts/clips/new.js 1 5 0
 *   Creates: clips/1/5/0/meta.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '../..');

const template = {
	png: 'sprite.png',
	numberOfFrames: 1,
	framesPerRow: 1,
	loop: true,
	retrigger: true,
	frameRatesForFrames: { 0: 12 }
};

export async function createClip(channel, note, velocity) {
	const dir = path.join(ROOT, 'clips', channel, note, velocity);

	// Check if already exists
	try {
		await fs.access(dir);
		throw new Error(`${dir} already exists`);
	} catch (err) {
		if (err.code === 'ENOENT') {
			// Directory doesn't exist, good
		} else if (err instanceof Error && err.message.includes('already exists')) {
			// Re-throw
			throw err;
		} else {
			// Unexpected error
			throw err;
		}
	}

	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(template, null, '\t'));

	console.log(`Created clips/${channel}/${note}/${velocity}/meta.json`);
	console.log('');
	console.log('Next steps:');
	console.log('  1. Add your sprite.png to the same folder');
	console.log('  2. Update meta.json with correct numberOfFrames and framesPerRow');
	console.log('  3. Run: npm run clips');
}

const [, , channel, note, velocity] = process.argv;
const isCli = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith('new.js'));

if (!channel || !note || !velocity) {
	console.log('Clip Scaffolding Tool');
	console.log('');
	console.log('Usage: node scripts/clips/new.js <channel> <note> <velocity>');
	console.log('');
	console.log('Example:');
	console.log('  node scripts/clips/new.js 1 5 0');
	console.log('  Creates: clips/1/5/0/meta.json with template');
	if (isCli) {
		process.exit(1);
	}
}

// Validate inputs are numbers (only in CLI mode)
if (isCli) {
	for (const [name, value] of [
		['channel', channel],
		['note', note],
		['velocity', velocity]
	]) {
		const num = parseInt(value, 10);
		if (isNaN(num) || num < 0) {
			const msg = `Error: ${name} must be a non-negative number, got "${value}"`;
			console.error(msg);
			process.exit(1);
		}
	}
}
if (isCli) {
	createClip(channel, note, velocity).catch(err => {
		console.error('Failed to create clip:', err.message);
		process.exit(1);
	});
}
