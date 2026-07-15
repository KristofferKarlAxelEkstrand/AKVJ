import fs from 'fs/promises';
import path from 'path';
import { getFilesWithExtension, getSubfolders } from './structure.js';
import { validateMetaFields } from './meta.js';
import { validateImageDimensions } from './image.js';

/**
 * Validation result for a single animation.
 * @typedef {Object} ValidationResult
 * @property {string} path - Animation path (channel/note/velocity)
 * @property {Object} meta - Parsed metadata
 * @property {string} pngPath - Path to PNG file
 * @property {string[]} errors - List of validation errors
 */

/**
 * Validate a single animation directory.
 * @param {string} animationDir - Path to animation directory
 * @param {string} animationPath - Logical path (e.g., "0/1/0")
 * @returns {Promise<ValidationResult>}
 */
async function validateAnimation(animationDir, animationPath) {
	const errors = [];
	let meta = null;
	let pngPath = null;

	// Check for meta.json or any .json file
	const jsonFiles = await getFilesWithExtension(animationDir, '.json');
	if (jsonFiles.length === 0) {
		errors.push('Missing meta.json file');
	} else {
		const metaFile = jsonFiles.find(f => f === 'meta.json') || jsonFiles[0];
		const metaPath = path.join(animationDir, metaFile);

		try {
			const content = await fs.readFile(metaPath, 'utf8');
			meta = JSON.parse(content);
		} catch (err) {
			errors.push(`Invalid JSON in ${metaFile}: ${err.message}`);
		}
	}

	// Check for PNG file
	const pngFiles = await getFilesWithExtension(animationDir, '.png');
	if (pngFiles.length === 0) {
		// Check if meta has a 'src' field pointing elsewhere
		if (!meta?.src) {
			errors.push('Missing PNG file');
		}
	} else {
		// If meta.png is specified, verify it matches an existing file
		if (meta?.png) {
			if (pngFiles.includes(meta.png)) {
				pngPath = path.join(animationDir, meta.png);
			} else {
				errors.push(`meta.json specifies png "${meta.png}" but file not found`);
				// Use the found png as a fallback and update meta to reflect the used file
				const fallback = pngFiles[0];
				pngPath = path.join(animationDir, fallback);
				if (meta) {
					meta.png = fallback;
				}
			}
		} else {
			pngPath = path.join(animationDir, pngFiles[0]);
		}
	}

	// Validate meta fields if meta was parsed
	if (meta) {
		errors.push(...validateMetaFields(meta));
		errors.push(...(await validateImageDimensions(pngPath, meta)));
	}

	return {
		path: animationPath,
		dir: animationDir,
		meta,
		pngPath,
		errors
	};
}

/**
 * Scan and validate all animations in a source directory.
 * @param {string} sourceDir - Root animations directory
 * @returns {Promise<{valid: ValidationResult[], errors: {path: string, errors: string[]}[]}>} `valid` holds successfully validated animations
 */
export async function validate(sourceDir) {
	const validAnimations = [];
	const errors = [];

	const channels = await getSubfolders(sourceDir);

	for (const channel of channels) {
		const channelDir = path.join(sourceDir, channel);
		const notes = await getSubfolders(channelDir);

		for (const note of notes) {
			const noteDir = path.join(channelDir, note);
			const velocities = await getSubfolders(noteDir);

			for (const velocity of velocities) {
				const velocityDir = path.join(noteDir, velocity);
				const animationPath = `${channel}/${note}/${velocity}`;

				const result = await validateAnimation(velocityDir, animationPath);

				if (result.errors.length > 0) {
					errors.push({ path: animationPath, errors: result.errors });
				} else {
					validAnimations.push(result);
				}
			}
		}
	}

	return { valid: validAnimations, errors };
}

export { getSubfolders, getFilesWithExtension } from './structure.js';
