/**
 * Metadata validation rules for animation meta.json.
 */

/**
 * Validate fields in a parsed meta.json object.
 * @param {Object} meta - Parsed metadata
 * @returns {string[]} Validation errors
 */
export function validateMetaFields(meta) {
	const errors = [];

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

	// Validate bitDepth - must be 1, 2, 4, or 8 if specified
	if (meta.bitDepth !== undefined) {
		const validBitDepths = [1, 2, 4, 8];
		if (!validBitDepths.includes(meta.bitDepth)) {
			errors.push(`bitDepth must be one of ${validBitDepths.join(', ')} (got ${meta.bitDepth})`);
		}
	}

	// Validate frameDurationBeats - must be positive number or array of positive numbers matching numberOfFrames
	if (meta.frameDurationBeats !== undefined) {
		if (Array.isArray(meta.frameDurationBeats)) {
			// Check for empty array (AnimationClip will warn and fall back, but we should catch it here)
			if (meta.frameDurationBeats.length === 0) {
				errors.push('meta.json: frameDurationBeats array cannot be empty');
			}
			// Array form - must match numberOfFrames length and all values must be positive
			if (meta.numberOfFrames && meta.frameDurationBeats.length > 0 && meta.frameDurationBeats.length !== meta.numberOfFrames) {
				errors.push(`meta.json: frameDurationBeats array length (${meta.frameDurationBeats.length}) must match numberOfFrames (${meta.numberOfFrames})`);
			}
			for (let i = 0; i < meta.frameDurationBeats.length; i++) {
				const val = meta.frameDurationBeats[i];
				if (typeof val !== 'number') {
					errors.push(`meta.json: frameDurationBeats[${i}] must be a number (got ${typeof val})`);
				} else if (val <= 0) {
					errors.push(`meta.json: frameDurationBeats[${i}] must be a positive number (got ${val})`);
				}
			}
		} else if (typeof meta.frameDurationBeats === 'number') {
			// Shorthand form - single positive number applies to all frames
			if (meta.frameDurationBeats <= 0) {
				errors.push(`meta.json: frameDurationBeats must be a positive number (got ${meta.frameDurationBeats})`);
			}
		} else {
			errors.push('meta.json: frameDurationBeats must be a positive number or array of positive numbers');
		}
	}

	if (meta.frameRatesForFrames !== undefined && meta.frameRatesForFrames !== null) {
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
				// Validate frame rate values are positive numbers
				const rate = meta.frameRatesForFrames[key];
				if (typeof rate !== 'number' || rate <= 0) {
					errors.push(`frameRatesForFrames["${key}"] must be a positive number (got ${rate})`);
				}
			}
		}
	}

	return errors;
}
