import fs from 'fs/promises';
import path from 'path';
import { getFilesWithExtension, getSubfolders } from './structure.js';
import { validateMetaFields } from './meta.js';
import { validateImageDimensions } from './image.js';

const CLIP_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/**
 * Validation result for a single clip.
 * @typedef {Object} ValidationResult
 * @property {string} clipId - Clip identity (folder name)
 * @property {Object} meta - Parsed metadata
 * @property {string} pngPath - Path to PNG file
 * @property {string[]} errors - List of validation errors
 */

/**
 * Validate a single clip directory.
 * @param {string} clipDir - Path to clip directory
 * @param {string} clipId - Clip identity (folder name)
 * @returns {Promise<ValidationResult>}
 */
async function validateClip(clipDir, clipId) {
	const errors = [];
	const meta = await loadClipMeta(clipDir, errors);
	const pngPath = await resolvePngPath(clipDir, meta, errors);

	if (meta) {
		validateMetaConstraints(meta, errors);
		errors.push(...validateMetaFields(meta));
		errors.push(...(await validateImageDimensions(pngPath, meta)));
	}

	return { clipId, dir: clipDir, meta, pngPath, errors };
}

async function loadClipMeta(clipDir, errors) {
	const jsonFiles = await getFilesWithExtension(clipDir, '.json');
	if (jsonFiles.length === 0) {
		errors.push('Missing meta.json file');
		return null;
	}
	const metaFile = jsonFiles.find(filename => filename === 'meta.json') || jsonFiles[0];
	const metaPath = path.join(clipDir, metaFile);
	try {
		return JSON.parse(await fs.readFile(metaPath, 'utf8'));
	} catch (error) {
		errors.push(`Invalid JSON in ${metaFile}: ${error.message}`);
		return null;
	}
}

async function resolvePngPath(clipDir, meta, errors) {
	const pngFiles = await getFilesWithExtension(clipDir, '.png');
	if (pngFiles.length === 0) {
		errors.push('Missing PNG file');
		return null;
	}
	if (meta?.png) {
		if (pngFiles.includes(meta.png)) {
			return path.join(clipDir, meta.png);
		}
		errors.push(`meta.json specifies png "${meta.png}" but file not found`);
		const fallback = pngFiles[0];
		if (meta) {
			meta.png = fallback;
		}
		return path.join(clipDir, fallback);
	}
	return path.join(clipDir, pngFiles[0]);
}

function validateMetaConstraints(meta, errors) {
	if (meta.src !== undefined) {
		errors.push('meta.src is no longer supported; use key-map.json clipId reuse instead');
	}
	if (meta.role !== undefined && meta.role !== 'bitmask') {
		errors.push(`Invalid role "${meta.role}" (allowed: bitmask)`);
	}
}

/**
 * Scan and validate all clips in a flat clip-id bucket.
 * @param {string} sourceDir - Root clips directory
 * @returns {Promise<{valid: ValidationResult[], errors: {path: string, errors: string[]}[]}>}
 */
export async function validate(sourceDir) {
	const validClips = [];
	const errors = [];

	const clipIds = await getSubfolders(sourceDir);

	for (const clipId of clipIds) {
		const result = validateClipId(clipId);
		if (result.errors) {
			errors.push(result.errors);
			continue;
		}
		await validateClipFolder(sourceDir, clipId, validClips, errors);
	}

	return { valid: validClips, errors };
}

function validateClipId(clipId) {
	if (/^\d+$/.test(clipId)) {
		return { errors: { clipId, errors: ['Numeric top-level folders are leftover nested MIDI paths; migrate to flat clipId folders (see npm run migrate:clips) or remove them'] } };
	}
	if (!CLIP_ID_PATTERN.test(clipId)) {
		return { errors: { clipId, errors: ['Invalid clipId folder name (use alphanumeric / hyphen / underscore, not starting with punctuation)'] } };
	}
	return {};
}

async function validateClipFolder(sourceDir, clipId, validClips, errors) {
	const clipFolder = path.join(sourceDir, clipId);
	const result = await validateClip(clipFolder, clipId);
	if (result.errors.length > 0) {
		errors.push({ clipId, errors: result.errors });
	} else {
		validClips.push(result);
	}
}

export { getSubfolders, getFilesWithExtension } from './structure.js';
