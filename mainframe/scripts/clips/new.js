#!/usr/bin/env node

/**
 * Clip Scaffolding Tool
 *
 * Creates a new clip bucket folder with a template meta.json file.
 *
 * Usage:
 *   node scripts/clips/new.js <clipId> [--role=bitmask]
 *
 * Example:
 *   node scripts/clips/new.js neon-skull
 *   Creates: clips/neon-skull/meta.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAINFRAME_ROOT = path.resolve(__dirname, '../..'); // mainframe/
const REPO_ROOT = path.resolve(MAINFRAME_ROOT, '..');

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

const template = {
	name: '',
	png: 'sprite.png',
	frames: 1,
	framesPerRow: 1,
	playback: 'loop',
	retrigger: true,
	frameRatesForFrames: { 0: 12 }
};

/**
 * @param {string} clipId
 * @param {{role?: string, clipsRoot?: string}} [options]
 */
export async function createClip(clipId, options = {}) {
	if (!CLIP_ID_PATTERN.test(clipId) || /^\d+$/.test(clipId)) {
		throw new Error(`Invalid clipId "${clipId}" (use alphanumeric / hyphen / underscore, not a bare number)`);
	}

	const clipsRoot = options.clipsRoot ?? path.join(REPO_ROOT, 'clips');
	const dir = path.join(clipsRoot, clipId);
	await validateClipDirDoesNotExist(dir);

	const meta = buildClipMeta(options.role);
	await fs.mkdir(dir, { recursive: true });
	await fs.writeFile(path.join(dir, 'meta.json'), `${JSON.stringify(meta, null, '\t')}\n`);

	printCreateInstructions(path.relative(REPO_ROOT, dir) || dir);
}

async function validateClipDirDoesNotExist(dir) {
	try {
		await fs.access(dir);
		throw new Error(`${dir} already exists`);
	} catch (error) {
		if (error.code === 'ENOENT') {
			return;
		}
		if (error instanceof Error && error.message.includes('already exists')) {
			throw error;
		}
		throw error;
	}
}

function buildClipMeta(role) {
	const meta = { ...template };
	if (role === 'bitmask') {
		meta.role = 'bitmask';
		meta.bitDepth = 1;
	}
	return meta;
}

function printCreateInstructions(relativeDir) {
	console.log(`Created ${relativeDir}/meta.json`);
	console.log('');
	console.log('Next steps:');
	console.log('  1. Add your sprite.png to the same folder');
	console.log('  2. Update meta.json with correct frames and framesPerRow');
	console.log('  3. Map the clip in clips/midi-layout.json (or Admin Mapping UI)');
	console.log('  4. Run: npm run clips');
}

const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
const flags = process.argv.slice(2).filter(a => a.startsWith('--'));
const clipId = args[0];
const roleFlag = flags.find(f => f.startsWith('--role='));
const role = roleFlag ? roleFlag.slice('--role='.length) : undefined;

const isCli = import.meta.url === `file://${process.argv[1]}` || (process.argv[1] && process.argv[1].endsWith('new.js'));

if (!clipId) {
	console.log('Clip Scaffolding Tool');
	console.log('');
	console.log('Usage: node scripts/clips/new.js <clipId> [--role=bitmask]');
	console.log('');
	console.log('Example:');
	console.log('  node scripts/clips/new.js neon-skull');
	console.log('  Creates: clips/neon-skull/meta.json with template');
	if (isCli) {
		process.exit(1);
	}
} else if (isCli) {
	createClip(clipId, { role }).catch(error => {
		console.error('Failed to create clip:', error.message);
		process.exit(1);
	});
}
