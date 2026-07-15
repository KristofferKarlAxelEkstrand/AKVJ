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
	// Skip dimension checks unless both counts are positive — negative or
	// zero values are already rejected by validateMetaFields.
	if (!pngPath || !(meta.framesPerRow > 0) || !(meta.numberOfFrames > 0)) {
		return errors;
	}

	const sharp = await loadSharp();
	if (!sharp) {
		return errors;
	}

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

	return errors;
}
