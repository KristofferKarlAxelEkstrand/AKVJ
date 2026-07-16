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
	const frameCount = meta.frames ?? meta.numberOfFrames;
	if (typeof frameCount !== 'number' || frameCount <= 0) {
		errors.push('frames must be a positive number');
	}
	if (typeof meta.framesPerRow !== 'number' || meta.framesPerRow <= 0) {
		errors.push('framesPerRow must be a positive number');
	}
	if (meta.loop !== undefined) {
		console.warn(`meta.json: "loop" property is deprecated. Converting to "playback": "${meta.loop ? 'loop' : 'once'}". Please update source file.`);
		meta.playback = meta.loop ? 'loop' : 'once';
		delete meta.loop;
	}

	if (meta.playback !== undefined) {
		const validModes = ['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub'];
		if (typeof meta.playback !== 'string' || !validModes.includes(meta.playback)) {
			errors.push(`playback must be one of: ${validModes.join(', ')}`);
		}
	}

	if (meta.retrigger !== undefined && typeof meta.retrigger !== 'boolean') {
		errors.push('retrigger must be a boolean');
	}
	if (meta.name !== undefined && typeof meta.name !== 'string') {
		errors.push('name must be a string');
	}
	if (meta.png !== undefined && typeof meta.png !== 'string') {
		errors.push('png must be a string');
	}
	if (meta.triggerType !== undefined) {
		const validTriggerTypes = ['momentary', 'latch', 'one-shot'];
		if (!validTriggerTypes.includes(meta.triggerType)) {
			errors.push(`triggerType must be one of ${validTriggerTypes.join(', ')} (got ${meta.triggerType})`);
		}
	}
	if (meta.triggerGroup !== undefined && meta.triggerGroup !== null && typeof meta.triggerGroup !== 'string' && typeof meta.triggerGroup !== 'number') {
		errors.push('triggerGroup must be a string, number, or null');
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
		const frameCount = meta.frames ?? meta.numberOfFrames;
		if (frameCount && meta.frameDurationBeats.length > 0 && meta.frameDurationBeats.length !== frameCount) {
			errors.push(`meta.json: frameDurationBeats array length (${meta.frameDurationBeats.length}) must match frames (${frameCount})`);
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
		const frameCount = meta.frames ?? meta.numberOfFrames;
		if (frameCount && frameNum >= frameCount) {
			errors.push(`frameRatesForFrames key "${key}" exceeds frames (${frameCount})`);
		}
		const rate = meta.frameRatesForFrames[key];
		if (typeof rate !== 'number' || rate <= 0) {
			errors.push(`frameRatesForFrames["${key}"] must be a positive number (got ${rate})`);
		}
	}
}
