/**
 * Defaults and mapping for shared clip-editor meta hydrate / save.
 * UI uses milliseconds natively; frameRatesForFrames is kept for backward compatibility.
 */

import { DEFAULT_SYNC_MODE, DEFAULT_BEATS_PER_BAR, SYNC_LENGTH_PRESETS, SYNC_MODES, DEFAULT_PLACEMENT, resolvePlacement, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_SCALING, SCALING_MODES, DEFAULT_PLAYBACK, DEFAULT_FRAME_RATE, DEFAULT_TRIGGER_TYPE, VALID_BIT_DEPTHS } from './clipSchema.js';

export { DEFAULT_SYNC_MODE, DEFAULT_BEATS_PER_BAR, SYNC_LENGTH_PRESETS, DEFAULT_PLACEMENT, resolvePlacement, DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_SCALE_MODE, DEFAULT_SCALING, SCALING_MODES, DEFAULT_PLAYBACK, DEFAULT_FRAME_RATE, DEFAULT_TRIGGER_TYPE, VALID_BIT_DEPTHS };

/**
 * Map clip meta into editor form values (legacy-safe defaults).
 * @param {object} [meta]
 */
export function editorValuesFromMeta(meta = {}) {
	const firstRate = meta.frameRatesForFrames?.['0'] ?? meta.frameRatesForFrames?.[0];
	const bitDepth = Number(meta.bitDepth);
	const sync = typeof meta.sync === 'string' && SYNC_MODES.includes(meta.sync) ? meta.sync : DEFAULT_SYNC_MODE;
	const syncLength = typeof meta.syncLength === 'string' && SYNC_LENGTH_PRESETS.includes(meta.syncLength) ? meta.syncLength : '1 bar';
	const syncBeats = typeof meta.syncBeats === 'number' && meta.syncBeats > 0 ? meta.syncBeats : null;
	const beatsPerBar = typeof meta.beatsPerBar === 'number' && Number.isInteger(meta.beatsPerBar) && meta.beatsPerBar > 0 ? meta.beatsPerBar : DEFAULT_BEATS_PER_BAR;
	return {
		name: typeof meta.name === 'string' ? meta.name : '',
		role: meta.role === 'bitmask' ? 'bitmask' : '',
		playback: typeof meta.playback === 'string' && meta.playback ? meta.playback : DEFAULT_PLAYBACK,
		frameWidth: Number(meta.frameWidth) > 0 ? Number(meta.frameWidth) : DEFAULT_FRAME_WIDTH,
		frameHeight: Number(meta.frameHeight) > 0 ? Number(meta.frameHeight) : DEFAULT_FRAME_HEIGHT,
		scaleMode: typeof meta.scaleMode === 'string' && meta.scaleMode ? meta.scaleMode : DEFAULT_SCALE_MODE,
		scaling: typeof meta.scaling === 'string' && SCALING_MODES.includes(meta.scaling) ? meta.scaling : DEFAULT_SCALING,
		placement: resolvePlacement(meta.placement),
		frameRate: Number(firstRate) > 0 ? Number(firstRate) : DEFAULT_FRAME_RATE,
		retrigger: meta.retrigger !== false,
		triggerType: typeof meta.triggerType === 'string' && meta.triggerType ? meta.triggerType : DEFAULT_TRIGGER_TYPE,
		triggerGroup: meta.triggerGroup !== null && meta.triggerGroup !== undefined ? String(meta.triggerGroup) : '',
		bitDepth: VALID_BIT_DEPTHS.includes(bitDepth) ? bitDepth : 1,
		sync,
		syncLength,
		syncBeats,
		beatsPerBar
	};
}

/**
 * Meta fields stamped on save so reopen is faithful.
 * Omits empty optional fields; uses `null` to clear fields on meta-only PUT.
 * @param {object} values
 * @returns {object}
 */
export function metaPatchFromEditor(values) {
	const patch = {
		playback: values.playback,
		scaleMode: values.scaleMode,
		frameWidth: values.frameWidth,
		frameHeight: values.frameHeight,
		placement: resolvePlacement(values.placement),
		retrigger: values.retrigger === true,
		triggerType: values.triggerType || DEFAULT_TRIGGER_TYPE
	};
	if (typeof values.scaling === 'string' && SCALING_MODES.includes(values.scaling)) {
		patch.scaling = values.scaling;
	}

	if (values.name) {
		patch.name = values.name;
	} else {
		patch.name = null;
	}

	if (values.role === 'bitmask') {
		patch.role = 'bitmask';
		const depth = Number(values.bitDepth);
		patch.bitDepth = VALID_BIT_DEPTHS.includes(depth) ? depth : 1;
	} else {
		patch.role = null;
		patch.bitDepth = null;
	}

	if (values.triggerGroup) {
		patch.triggerGroup = values.triggerGroup;
	} else {
		patch.triggerGroup = null;
	}

	if (values.frameDurationsMs) {
		patch.frameDurationsMs = values.frameDurationsMs;
	}

	if (values.frameRatesForFrames) {
		patch.frameRatesForFrames = values.frameRatesForFrames;
	}

	Object.assign(patch, syncFieldsPatch(values));

	return patch;
}

/**
 * Optional meta payload for create / frames overwrite APIs.
 * @param {object} values
 * @returns {object}
 */
export function optionalMetaFromEditor(values) {
	const optional = {
		syncOptionalMeta: true,
		retrigger: values.retrigger === true,
		triggerType: values.triggerType || DEFAULT_TRIGGER_TYPE,
		placement: resolvePlacement(values.placement)
	};
	if (typeof values.scaling === 'string' && SCALING_MODES.includes(values.scaling)) {
		optional.scaling = values.scaling;
	}
	if (values.triggerGroup) {
		optional.triggerGroup = values.triggerGroup;
	}
	if (values.role === 'bitmask') {
		optional.role = 'bitmask';
		const depth = Number(values.bitDepth);
		optional.bitDepth = VALID_BIT_DEPTHS.includes(depth) ? depth : 1;
	}
	Object.assign(optional, syncFieldsPatch(values));
	return optional;
}

/**
 * Sync fields for save payloads.
 * Beat mode uses syncLength/syncBeats; free mode clears sync fields.
 * @param {object} values
 * @returns {object}
 */
function syncFieldsPatch(values) {
	const sync = values.sync === 'beat' ? 'beat' : 'free';
	if (sync === 'beat') {
		const patch = {
			sync: 'beat',
			syncLength: typeof values.syncLength === 'string' ? values.syncLength : '1 bar',
			beatsPerBar: typeof values.beatsPerBar === 'number' && Number.isInteger(values.beatsPerBar) && values.beatsPerBar > 0 ? values.beatsPerBar : DEFAULT_BEATS_PER_BAR
		};
		if (patch.syncLength === 'custom') {
			patch.syncBeats = typeof values.syncBeats === 'number' && values.syncBeats > 0 ? values.syncBeats : null;
		} else {
			patch.syncBeats = null;
		}
		return patch;
	}
	return {
		sync: 'free',
		syncLength: null,
		syncBeats: null,
		beatsPerBar: null
	};
}
