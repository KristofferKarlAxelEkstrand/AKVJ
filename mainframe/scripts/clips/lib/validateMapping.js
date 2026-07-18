import fs from 'fs/promises';
import path from 'path';
import { collectNestedKeyMapErrors } from '../../../server/mappingService.js';

/**
 * Validate key-map.json against the flat clip bucket.
 * Uses shared mappingService rules for channel/note/velocity/clipId/duplicates.
 * @param {string} sourceDir - Clips root (clipId folders)
 * @param {Array<{clipId: string}>} validClips - Clips that passed folder validation
 * @param {string} [keyMapPath] - Explicit key-map path (defaults to sourceDir/key-map.json)
 * @returns {Promise<{errors: {path: string, errors: string[]}[]}>}
 */
export async function validateKeyMap(sourceDir, validClips, keyMapPath) {
	const validIds = new Set(validClips.map(clip => clip.clipId));
	const keyMap = await loadKeyMap(keyMapPath ?? path.join(sourceDir, 'key-map.json'));
	if (keyMap.errors) {
		return { errors: keyMap.errors };
	}

	return { errors: collectNestedKeyMapErrors(keyMap.data, validIds) };
}

async function loadKeyMap(layoutPath) {
	let raw;
	try {
		raw = await fs.readFile(layoutPath, 'utf8');
	} catch (error) {
		if (error.code === 'ENOENT') {
			return { errors: [{ path: 'key-map.json', errors: ['Missing key-map.json (required for runtime ClipLoader)'] }] };
		}
		throw error;
	}
	let keyMap;
	try {
		keyMap = JSON.parse(raw);
	} catch (error) {
		return { errors: [{ path: 'key-map.json', errors: [`Invalid JSON: ${error.message}`] }] };
	}
	if (!keyMap || typeof keyMap !== 'object' || Array.isArray(keyMap)) {
		return { errors: [{ path: 'key-map.json', errors: ['Must be a JSON object keyed by channel number'] }] };
	}
	return { data: keyMap };
}
