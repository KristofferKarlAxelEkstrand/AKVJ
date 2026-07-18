/**
 * Defaults and mapping for shared clip-editor meta hydrate / save.
 * Keep FPS on disk; the UI uses milliseconds via frameTiming helpers.
 */

import { DEFAULT_SYNC_MODE, DEFAULT_BEATS_PER_BAR, SYNC_LENGTH_PRESETS, SYNC_MODES } from './clipSchema.js';

export const DEFAULT_FRAME_WIDTH = 240;
export const DEFAULT_FRAME_HEIGHT = 135;
export const DEFAULT_SCALE_MODE = 'fit';
export const DEFAULT_PLAYBACK = 'loop';
export const DEFAULT_FRAME_RATE = 12;
export const DEFAULT_TRIGGER_TYPE = 'momentary';
export const BIT_DEPTHS = [1, 2, 4, 8];
export { DEFAULT_SYNC_MODE, DEFAULT_BEATS_PER_BAR, SYNC_LENGTH_PRESETS };

/**
 * @param {unknown} raw
 * @returns {{ ok: true, value: number|number[]|null } | { ok: false, error: string }}
 */
export function parseFrameDurationBeats(raw) {
	if (raw === null || raw === undefined) {
		return { ok: true, value: null };
	}
	const text = String(raw).trim();
	if (!text) {
		return { ok: true, value: null };
	}
	let parsed;
	try {
		parsed = JSON.parse(text);
	} catch {
		const asNumber = Number(text);
		if (Number.isFinite(asNumber) && asNumber > 0) {
			return { ok: true, value: asNumber };
		}
		return { ok: false, error: 'frameDurationBeats must be a number or JSON array of numbers' };
	}
	if (typeof parsed === 'number' && Number.isFinite(parsed) && parsed > 0) {
		return { ok: true, value: parsed };
	}
	if (Array.isArray(parsed) && parsed.length > 0 && parsed.every(value => typeof value === 'number' && Number.isFinite(value) && value > 0)) {
		return { ok: true, value: parsed };
	}
	return { ok: false, error: 'frameDurationBeats must be a positive number or array of positive numbers' };
}

/**
 * Map clip meta into editor form values (legacy-safe defaults).
 * @param {object} [meta]
 */
export function editorValuesFromMeta(meta = {}) {
	const firstRate = meta.frameRatesForFrames?.['0'] ?? meta.frameRatesForFrames?.[0];
	const bitDepth = Number(meta.bitDepth);
	const sync = typeof meta.sync === 'string' && SYNC_MODES.includes(meta.sync) ? meta.sync : DEFAULT_SYNC_MODE;
	const syncLength =
		typeof meta.syncLength === 'string' && SYNC_LENGTH_PRESETS.includes(meta.syncLength) ? meta.syncLength : '1 bar';
	const syncBeats = typeof meta.syncBeats === 'number' && meta.syncBeats > 0 ? meta.syncBeats : null;
	const beatsPerBar =
		typeof meta.beatsPerBar === 'number' && Number.isInteger(meta.beatsPerBar) && meta.beatsPerBar > 0
			? meta.beatsPerBar
			: DEFAULT_BEATS_PER_BAR;
	return {
		name: typeof meta.name === 'string' ? meta.name : '',
		role: meta.role === 'bitmask' ? 'bitmask' : '',
		playback: typeof meta.playback === 'string' && meta.playback ? meta.playback : DEFAULT_PLAYBACK,
		frameWidth: Number(meta.frameWidth) > 0 ? Number(meta.frameWidth) : DEFAULT_FRAME_WIDTH,
		frameHeight: Number(meta.frameHeight) > 0 ? Number(meta.frameHeight) : DEFAULT_FRAME_HEIGHT,
		scaleMode: typeof meta.scaleMode === 'string' && meta.scaleMode ? meta.scaleMode : DEFAULT_SCALE_MODE,
		frameRate: Number(firstRate) > 0 ? Number(firstRate) : DEFAULT_FRAME_RATE,
		retrigger: meta.retrigger !== false,
		triggerType: typeof meta.triggerType === 'string' && meta.triggerType ? meta.triggerType : DEFAULT_TRIGGER_TYPE,
		triggerGroup: meta.triggerGroup !== null && meta.triggerGroup !== undefined ? String(meta.triggerGroup) : '',
		bitDepth: BIT_DEPTHS.includes(bitDepth) ? bitDepth : 1,
		frameDurationBeatsText:
			meta.frameDurationBeats !== null && meta.frameDurationBeats !== undefined ? JSON.stringify(meta.frameDurationBeats) : '',
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
		retrigger: values.retrigger === true,
		triggerType: values.triggerType || DEFAULT_TRIGGER_TYPE
	};

	if (values.name) {
		patch.name = values.name;
	} else {
		patch.name = null;
	}

	if (values.role === 'bitmask') {
		patch.role = 'bitmask';
		const depth = Number(values.bitDepth);
		patch.bitDepth = BIT_DEPTHS.includes(depth) ? depth : 1;
	} else {
		patch.role = null;
		patch.bitDepth = null;
	}

	if (values.triggerGroup) {
		patch.triggerGroup = values.triggerGroup;
	} else {
		patch.triggerGroup = null;
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
		triggerType: values.triggerType || DEFAULT_TRIGGER_TYPE
	};
	if (values.triggerGroup) {
		optional.triggerGroup = values.triggerGroup;
	}
	if (values.role === 'bitmask') {
		optional.role = 'bitmask';
		const depth = Number(values.bitDepth);
		optional.bitDepth = BIT_DEPTHS.includes(depth) ? depth : 1;
	}
	Object.assign(optional, syncFieldsPatch(values));
	return optional;
}

/**
 * Sync + frameDurationBeats for save payloads.
 * Beat mode clears explicit frameDurationBeats so the engine expands from sync fields.
 * @param {object} values
 * @returns {object}
 */
function syncFieldsPatch(values) {
	const sync = values.sync === 'beat' ? 'beat' : 'free';
	if (sync === 'beat') {
		const patch = {
			sync: 'beat',
			syncLength: typeof values.syncLength === 'string' ? values.syncLength : '1 bar',
			beatsPerBar:
				typeof values.beatsPerBar === 'number' && Number.isInteger(values.beatsPerBar) && values.beatsPerBar > 0
					? values.beatsPerBar
					: DEFAULT_BEATS_PER_BAR,
			frameDurationBeats: null
		};
		if (patch.syncLength === 'custom') {
			patch.syncBeats = typeof values.syncBeats === 'number' && values.syncBeats > 0 ? values.syncBeats : null;
		} else {
			patch.syncBeats = null;
		}
		return patch;
	}
	const patch = {
		sync: 'free',
		syncLength: null,
		syncBeats: null,
		beatsPerBar: null
	};
	if (values.frameDurationBeats !== null && values.frameDurationBeats !== undefined) {
		patch.frameDurationBeats = values.frameDurationBeats;
	} else {
		patch.frameDurationBeats = null;
	}
	return patch;
}
