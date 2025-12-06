import fs from 'fs/promises';
import path from 'path';

/**
 * Try to load sharp for image dimension validation.
 * @returns {Promise<import('sharp')|null>}
 */
async function loadSharp() {
	try {
		const sharp = await import('sharp');
		return sharp.default;
	} catch {
		return null;
	}
}

/**
 * Validation result for a single animation.
 * @typedef {Object} ValidationResult
 * @property {string} path - Animation path (channel/note/velocity)
 * @property {Object} meta - Parsed metadata
 * @property {string} pngPath - Path to PNG file
 * @property {string[]} errors - List of validation errors
 */

/**
 * Get all subdirectories of a directory.
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} List of subdirectory names
 */
async function getSubfolders(dir) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		return entries.filter(e => e.isDirectory()).map(e => e.name);
	} catch {
		return [];
	}
}

/**
 * Get files with a specific extension in a directory.
 * @param {string} dir - Directory path
 * @param {string} ext - Extension including dot (e.g., '.png')
 * @returns {Promise<string[]>} List of matching filenames
 */
async function getFilesWithExtension(dir, ext) {
	try {
		const entries = await fs.readdir(dir);
		return entries.filter(f => path.extname(f) === ext);
	} catch {
		return [];
	}
}

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
				pngPath = path.join(animationDir, pngFiles[0]);
			}
		} else {
			pngPath = path.join(animationDir, pngFiles[0]);
		}
	}

	// Validate meta fields if meta was parsed
	if (meta) {
		if (typeof meta.numberOfFrames !== 'number' || meta.numberOfFrames <= 0) {
			errors.push('numberOfFrames must be a positive number');
		}

		if (typeof meta.framesPerRow !== 'number' || meta.framesPerRow <= 0) {
			errors.push('framesPerRow must be a positive number');
		}

		if (meta.loop !== undefined && typeof meta.loop !== 'boolean') {
			errors.push('loop must be a boolean');
		}

		if (meta.retrigger !== undefined && typeof meta.retrigger !== 'boolean') {
			errors.push('retrigger must be a boolean');
		}

		if (meta.frameRatesForFrames !== undefined) {
			if (typeof meta.frameRatesForFrames !== 'object') {
				errors.push('frameRatesForFrames must be an object');
			} else {
				for (const key of Object.keys(meta.frameRatesForFrames)) {
					const frameNum = parseInt(key, 10);
					if (isNaN(frameNum) || frameNum < 0) {
						errors.push(`frameRatesForFrames key "${key}" is not a valid frame number`);
					}
					if (meta.numberOfFrames && frameNum >= meta.numberOfFrames) {
						errors.push(`frameRatesForFrames key "${key}" exceeds numberOfFrames (${meta.numberOfFrames})`);
					}
				}
			}
		}

		// Validate image dimensions if we have a PNG and sharp is available
		if (pngPath && meta.framesPerRow > 0 && meta.numberOfFrames > 0) {
			const sharp = await loadSharp();
			if (sharp) {
				try {
					const metadata = await sharp(pngPath).metadata();
					const { width, height } = metadata;

					// Check width is divisible by framesPerRow
					if (width % meta.framesPerRow !== 0) {
						errors.push(`Image width (${width}) must be divisible by framesPerRow (${meta.framesPerRow})`);
					}

					// Check frame count: rows * framesPerRow >= numberOfFrames
					const frameWidth = Math.floor(width / meta.framesPerRow);
					if (frameWidth > 0) {
						// Calculate rows needed for the declared number of frames
						const rowsNeeded = Math.ceil(meta.numberOfFrames / meta.framesPerRow);
						// Frame height = total height / rows needed
						const frameHeight = Math.floor(height / rowsNeeded);

						// Verify height is evenly divisible
						if (height % rowsNeeded !== 0) {
							errors.push(`Image height (${height}) must be divisible by number of rows (${rowsNeeded})`);
						}

						// Verify we have enough rows
						const actualRows = Math.floor(height / frameHeight);
						const totalFrameSlots = actualRows * meta.framesPerRow;
						if (totalFrameSlots < meta.numberOfFrames) {
							errors.push(`Image has ${totalFrameSlots} frame slots (${actualRows} rows × ${meta.framesPerRow}) but numberOfFrames is ${meta.numberOfFrames}`);
						}
					}
				} catch (err) {
					errors.push(`Failed to read image dimensions: ${err.message}`);
				}
			}
		}
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
 * @returns {Promise<{valid: ValidationResult[], errors: {path: string, errors: string[]}[]}>}
 */
export async function validate(sourceDir) {
	const valid = [];
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
					valid.push(result);
				}
			}
		}
	}

	return { valid, errors };
}

export { getSubfolders, getFilesWithExtension };
