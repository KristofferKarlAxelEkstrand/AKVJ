/**
 * Image dimension validation for clip spritesheets.
 */

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
 * Validate that a PNG's dimensions match the metadata.
 * @param {string} pngPath - Path to PNG file
 * @param {Object} meta - Parsed metadata
 * @returns {Promise<string[]>} Validation errors
 */
export async function validateImageDimensions(pngPath, meta) {
	const errors = [];
	if (!pngPath || !(meta.framesPerRow > 0) || !((meta.frames ?? meta.numberOfFrames) > 0)) {
		return errors;
	}

	const sharp = await loadSharp();
	if (!sharp) {
		return errors;
	}

	try {
		const metadata = await sharp(pngPath).metadata();
		const { width, height } = metadata;
		validateWidthDivisibility(width, meta.framesPerRow, errors);
		validateFrameHeight(width, height, meta, errors);
	} catch (error) {
		errors.push(`Failed to read image dimensions: ${error.message}`);
	}

	return errors;
}

function validateWidthDivisibility(width, framesPerRow, errors) {
	if (width % framesPerRow !== 0) {
		errors.push(`Image width (${width}) must be divisible by framesPerRow (${framesPerRow})`);
	}
}

function validateFrameHeight(width, height, meta, errors) {
	const frameWidth = Math.floor(width / meta.framesPerRow);
	if (frameWidth <= 0) {
		return;
	}
	const rowsNeeded = Math.ceil((meta.frames ?? meta.numberOfFrames) / meta.framesPerRow);
	const frameHeight = Math.floor(height / rowsNeeded);

	if (height % rowsNeeded !== 0) {
		errors.push(`Image height (${height}) must be divisible by number of rows (${rowsNeeded})`);
	}

	const actualRows = Math.floor(height / frameHeight);
	const totalFrameSlots = actualRows * meta.framesPerRow;
	const frameCount = meta.frames ?? meta.numberOfFrames;
	if (totalFrameSlots < frameCount) {
		errors.push(`Image has ${totalFrameSlots} frame slots (${actualRows} rows × ${meta.framesPerRow}) but frames is ${frameCount}`);
	}
}
