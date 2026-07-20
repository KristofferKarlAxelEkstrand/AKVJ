/**
 * Opt-in migrations for source clip meta.json files (`--fix`).
 *
 * Validation is report-only: it never touches an author's file. This module is the
 * only place in the pipeline that rewrites a source meta.json, it runs solely when
 * the operator asks for it, and it reports every change it makes. Clips with nothing
 * to migrate are not written at all, so a hand-written meta.json survives byte-for-byte.
 */
import fs from 'fs/promises';
import path from 'path';
import { writeJsonAtomic } from '../../../server/writeJsonAtomic.js';
import { getSubfolders, getFilesWithExtension } from './validate/structure.js';
import { CLIP_ID_PATTERN } from '../../../shared/clipId.js';

/**
 * Migrate the deprecated `loop` boolean to `playback`.
 * @param {Object} meta
 * @param {string[]} changes
 */
function migrateLoopToPlayback(meta, changes) {
	if (meta.loop === undefined) {
		return;
	}
	if (meta.playback === undefined) {
		const playback = meta.loop ? 'loop' : 'once';
		meta.playback = playback;
		changes.push(`loop: ${meta.loop} → playback: "${playback}"`);
	} else {
		changes.push(`removed deprecated loop (playback: "${meta.playback}" already set)`);
	}
	delete meta.loop;
}

/**
 * Point `png` at the sprite that actually exists when it names a missing file.
 * Ambiguous cases (several PNGs on disk) are reported, never guessed.
 * @param {Object} meta
 * @param {string[]} pngFiles
 * @param {string[]} changes
 * @param {string[]} skipped
 */
function repointMissingPng(meta, pngFiles, changes, skipped) {
	if (typeof meta.png !== 'string' || pngFiles.includes(meta.png)) {
		return;
	}
	if (pngFiles.length !== 1) {
		skipped.push(`png "${meta.png}" not found and ${pngFiles.length} PNG files present — fix it by hand`);
		return;
	}
	changes.push(`png: "${meta.png}" → "${pngFiles[0]}"`);
	meta.png = pngFiles[0];
}

/**
 * Apply migrations to one clip folder.
 * @param {string} clipDir
 * @returns {Promise<{changes: string[], skipped: string[], errors: string[]}>}
 */
export async function fixClip(clipDir) {
	const changes = [];
	const skipped = [];
	const errors = [];
	const metaPath = path.join(clipDir, 'meta.json');

	let meta;
	try {
		meta = JSON.parse(await fs.readFile(metaPath, 'utf8'));
	} catch (error) {
		if (error.code !== 'ENOENT') {
			errors.push(`Cannot read meta.json: ${error.message}`);
		}
		return { changes, skipped, errors };
	}

	migrateLoopToPlayback(meta, changes);
	repointMissingPng(meta, await getFilesWithExtension(clipDir, '.png'), changes, skipped);

	if (changes.length > 0) {
		await writeJsonAtomic(metaPath, meta);
	}
	return { changes, skipped, errors };
}

/**
 * Apply migrations to every clip in a source bucket.
 * @param {string} sourceDir - Root clips directory
 * @returns {Promise<{fixed: {clipId: string, changes: string[]}[], skipped: {clipId: string, skipped: string[]}[], errors: {clipId: string, errors: string[]}[]}>}
 */
export async function fixClips(sourceDir) {
	const fixed = [];
	const skipped = [];
	const errors = [];

	for (const clipId of await getSubfolders(sourceDir)) {
		if (!CLIP_ID_PATTERN.test(clipId)) {
			continue;
		}
		const result = await fixClip(path.join(sourceDir, clipId));
		if (result.changes.length > 0) {
			fixed.push({ clipId, changes: result.changes });
		}
		if (result.skipped.length > 0) {
			skipped.push({ clipId, skipped: result.skipped });
		}
		if (result.errors.length > 0) {
			errors.push({ clipId, errors: result.errors });
		}
	}

	return { fixed, skipped, errors };
}
