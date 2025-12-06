#!/usr/bin/env node

/**
 * Animation Scaffolding Tool
 *
 * Creates a new animation slot with a template meta.json file.
 *
 * Usage:
 *   node scripts/animations/new.js <channel> <note> <velocity>
 *
 * Example:
 *   node scripts/animations/new.js 0 5 0
 *   Creates: animations/0/5/0/meta.json
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

export async function createAnimation(channel, note, velocity) {
	const dir = path.join(ROOT, 'animations', channel, note, velocity);

	// Check if already exists
	try {
		await fs.access(dir);
		console.error(`Error: ${dir} already exists`);
		process.exit(1);
	} catch {
		// Directory doesn't exist, good
	}

	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'meta.json'), JSON.stringify(template, null, '\t'));

	console.log(`Created animations/${channel}/${note}/${velocity}/meta.json`);
	console.log('');
	console.log('Next steps:');
	console.log('  1. Add your sprite.png to the same folder');
	console.log('  2. Update meta.json with correct numberOfFrames and framesPerRow');
	console.log('  3. Run: npm run animations');
}

const [, , channel, note, velocity] = process.argv;
const isCli = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith('new.js'));

if (!channel || !note || !velocity) {
	console.log('Animation Scaffolding Tool');
	console.log('');
	console.log('Usage: node scripts/animations/new.js <channel> <note> <velocity>');
	console.log('');
	console.log('Example:');
	console.log('  node scripts/animations/new.js 0 5 0');
	console.log('  Creates: animations/0/5/0/meta.json with template');
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
	createAnimation(channel, note, velocity);
}
