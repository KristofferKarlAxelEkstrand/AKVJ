/**
 * Metadata validation rules for clip meta.json.
 */

/**
 * Validate fields in a parsed meta.json object.
 * @param {Object} meta - Parsed metadata
 * @returns {string[]} Validation errors
 */
export function validateMetaFields(meta) {
	const errors = [];

	validateBasicFields(meta, errors);
	validateBitDepth(meta, errors);

	if (meta.frameDurationBeats !== undefined) {
		validateFrameDurationBeats(meta, errors);
	}
	if (meta.frameRatesForFrames !== undefined && meta.frameRatesForFrames !== null) {
		validateFrameRatesForFrames(meta, errors);
	}

	return errors;
}

function validateBasicFields(meta, errors) {
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
}

function validateBitDepth(meta, errors) {
	if (meta.bitDepth !== undefined) {
		const validBitDepths = [1, 2, 4, 8];
		if (!validBitDepths.includes(meta.bitDepth)) {
			errors.push(`bitDepth must be one of ${validBitDepths.join(', ')} (got ${meta.bitDepth})`);
		}
	}
}

function validateFrameDurationBeats(meta, errors) {
	if (Array.isArray(meta.frameDurationBeats)) {
		if (meta.frameDurationBeats.length === 0) {
			errors.push('meta.json: frameDurationBeats array cannot be empty');
		}
		if (meta.numberOfFrames && meta.frameDurationBeats.length > 0 && meta.frameDurationBeats.length !== meta.numberOfFrames) {
			errors.push(`meta.json: frameDurationBeats array length (${meta.frameDurationBeats.length}) must match numberOfFrames (${meta.numberOfFrames})`);
		}
		for (let i = 0; i < meta.frameDurationBeats.length; i++) {
			const duration = meta.frameDurationBeats[i];
			if (typeof duration !== 'number') {
				errors.push(`meta.json: frameDurationBeats[${i}] must be a number (got ${typeof duration})`);
			} else if (duration <= 0) {
				errors.push(`meta.json: frameDurationBeats[${i}] must be a positive number (got ${duration})`);
			}
		}
	} else if (typeof meta.frameDurationBeats === 'number') {
		if (meta.frameDurationBeats <= 0) {
			errors.push(`meta.json: frameDurationBeats must be a positive number (got ${meta.frameDurationBeats})`);
		}
	} else {
		errors.push('meta.json: frameDurationBeats must be a positive number or array of positive numbers');
	}
}

function validateFrameRatesForFrames(meta, errors) {
	if (typeof meta.frameRatesForFrames !== 'object') {
		errors.push('frameRatesForFrames must be an object');
		return;
	}
	for (const key of Object.keys(meta.frameRatesForFrames)) {
		const frameNum = parseInt(key, 10);
		if (isNaN(frameNum) || frameNum < 0) {
			errors.push(`frameRatesForFrames key "${key}" is not a valid frame number`);
		}
		if (meta.numberOfFrames && frameNum >= meta.numberOfFrames) {
			errors.push(`frameRatesForFrames key "${key}" exceeds numberOfFrames (${meta.numberOfFrames})`);
		}
		const rate = meta.frameRatesForFrames[key];
		if (typeof rate !== 'number' || rate <= 0) {
			errors.push(`frameRatesForFrames["${key}"] must be a positive number (got ${rate})`);
		}
	}
}
