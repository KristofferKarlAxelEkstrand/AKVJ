/**
 * Metadata validation rules for clip meta.json.
 */
import { PLAYBACK_MODES, TRIGGER_TYPES, VALID_BIT_DEPTHS, SYNC_MODES, SYNC_LENGTH_PRESETS } from '../../../../shared/clipSchema.js';

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
	validateSyncFields(meta, errors);

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
		console.warn(`meta.json: "loop" property is deprecated. Use "playback": "${meta.loop ? 'loop' : 'once'}" instead. Run with --fix to auto-migrate.`);
	}

	if (meta.playback !== undefined) {
		if (typeof meta.playback !== 'string' || !PLAYBACK_MODES.includes(meta.playback)) {
			errors.push(`playback must be one of: ${PLAYBACK_MODES.join(', ')}`);
		}
	} else if (meta.loop !== undefined) {
		// Validate the implied playback from legacy loop field
		const impliedPlayback = meta.loop ? 'loop' : 'once';
		if (!PLAYBACK_MODES.includes(impliedPlayback)) {
			errors.push(`playback must be one of: ${PLAYBACK_MODES.join(', ')}`);
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
		if (!TRIGGER_TYPES.includes(meta.triggerType)) {
			errors.push(`triggerType must be one of ${TRIGGER_TYPES.join(', ')} (got ${meta.triggerType})`);
		}
	}
	if (meta.triggerGroup !== undefined && meta.triggerGroup !== null && typeof meta.triggerGroup !== 'string' && typeof meta.triggerGroup !== 'number') {
		errors.push('triggerGroup must be a string, number, or null');
	}
	if (meta.scaleMode !== undefined) {
		const validScaleModes = ['fit', 'cover', 'stretch', 'none'];
		if (!validScaleModes.includes(meta.scaleMode)) {
			errors.push(`scaleMode must be one of: ${validScaleModes.join(', ')}`);
		}
	}
	if (meta.frameWidth !== undefined && (typeof meta.frameWidth !== 'number' || meta.frameWidth <= 0)) {
		errors.push('frameWidth must be a positive number');
	}
	if (meta.frameHeight !== undefined && (typeof meta.frameHeight !== 'number' || meta.frameHeight <= 0)) {
		errors.push('frameHeight must be a positive number');
	}
}

function validateBitDepth(meta, errors) {
	if (meta.bitDepth !== undefined) {
		if (!VALID_BIT_DEPTHS.includes(meta.bitDepth)) {
			errors.push(`bitDepth must be one of ${VALID_BIT_DEPTHS.join(', ')} (got ${meta.bitDepth})`);
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

function validateSyncFields(meta, errors) {
	if (meta.sync !== undefined) {
		if (typeof meta.sync !== 'string' || !SYNC_MODES.includes(meta.sync)) {
			errors.push(`sync must be one of: ${SYNC_MODES.join(', ')} (got ${meta.sync})`);
		}
	}
	if (meta.sync === 'beat' && meta.syncLength === undefined) {
		errors.push('syncLength is required when sync is "beat"');
	}
	if (meta.syncLength !== undefined) {
		if (typeof meta.syncLength !== 'string' || !SYNC_LENGTH_PRESETS.includes(meta.syncLength)) {
			errors.push(`syncLength must be one of: ${SYNC_LENGTH_PRESETS.join(', ')} (got ${meta.syncLength})`);
		}
	}
	if (meta.syncBeats !== undefined) {
		if (typeof meta.syncBeats !== 'number' || meta.syncBeats <= 0) {
			errors.push(`syncBeats must be a positive number (got ${meta.syncBeats})`);
		}
	}
	if (meta.beatsPerBar !== undefined) {
		if (typeof meta.beatsPerBar !== 'number' || meta.beatsPerBar <= 0 || !Number.isInteger(meta.beatsPerBar)) {
			errors.push(`beatsPerBar must be a positive integer (got ${meta.beatsPerBar})`);
		}
	}
	if (meta.syncLength === 'custom' && (meta.syncBeats === undefined || typeof meta.syncBeats !== 'number' || meta.syncBeats <= 0)) {
		errors.push('syncBeats is required when syncLength is "custom"');
	}
}
