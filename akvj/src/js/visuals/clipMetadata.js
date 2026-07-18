/**
 * Clip metadata normalization — single source of truth for reading meta.json.
 *
 * Handles legacy field aliases (`numberOfFrames` → `frames`, `loop` → `playback`)
 * and provides sensible defaults so downstream code never needs to duplicate
 * the `frames ?? numberOfFrames` or `playback ?? (loop === false ? 'once' : 'loop')` logic.
 */

/**
 * Canonical playback modes supported by the engine.
 * @type {readonly string[]}
 */
export const PLAYBACK_MODES = Object.freeze(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);

/**
 * Default clip frame dimensions (AKVJ canvas resolution).
 */
export const DEFAULT_FRAME_WIDTH = 240;
export const DEFAULT_FRAME_HEIGHT = 135;

/**
 * Default scale mode for clip frames.
 */
export const DEFAULT_SCALE_MODE = 'fit';

/**
 * Default playback mode when none is specified.
 */
export const DEFAULT_PLAYBACK = 'loop';

/**
 * Default trigger type when none is specified.
 */
export const DEFAULT_TRIGGER_TYPE = 'momentary';

/**
 * Canonical trigger types supported by the engine.
 * @readonly
 * @enum {string}
 */
export const TRIGGER_TYPES = Object.freeze({
	MOMENTARY: 'momentary',
	LATCH: 'latch',
	ONE_SHOT: 'one-shot'
});

/** Sync modes for clip timing. */
export const SYNC_MODES = Object.freeze(['free', 'beat']);

/** Default sync mode. */
export const DEFAULT_SYNC_MODE = 'free';

/** Preset length strings for beat-synced clips. */
export const SYNC_LENGTH_PRESETS = Object.freeze(['1/4 beat', '1/2 beat', '1 beat', '2 beats', '1 bar', '2 bars', '4 bars', '8 bars', 'custom']);

/** Default beats per bar (4/4 time). */
export const DEFAULT_BEATS_PER_BAR = 4;

/** Default placement (centered). */
export const DEFAULT_PLACEMENT = Object.freeze({ x: 0, y: 0 });

/**
 * Normalize raw clip metadata from meta.json into a canonical shape.
 *
 * - `frames` takes priority; falls back to legacy `numberOfFrames`
 * - `playback` takes priority; falls back to legacy `loop` (false → 'once', true/undefined → 'loop')
 * - Optional fields get defaults where the engine expects a value
 *
 * Does NOT mutate the input object.
 *
 * @param {Object} rawMeta - Parsed meta.json
 * @returns {Object} Normalized metadata with canonical field names
 */
export function normalizeClipMetadata(rawMeta) {
	if (!rawMeta || typeof rawMeta !== 'object' || Array.isArray(rawMeta)) {
		return {};
	}

	const frames = rawMeta.frames ?? rawMeta.numberOfFrames ?? null;
	const playback = resolvePlayback(rawMeta);

	const frameDurationBeats = resolveFrameDurationBeats(rawMeta, frames);

	return {
		png: rawMeta.png ?? 'sprite.png',
		frames,
		framesPerRow: rawMeta.framesPerRow ?? null,
		playback,
		frameRatesForFrames: rawMeta.frameRatesForFrames ?? null,
		frameDurationBeats,
		retrigger: rawMeta.retrigger ?? true,
		bitDepth: rawMeta.bitDepth ?? null,
		triggerType: rawMeta.triggerType ?? DEFAULT_TRIGGER_TYPE,
		triggerGroup: rawMeta.triggerGroup ?? null,
		scaleMode: rawMeta.scaleMode ?? DEFAULT_SCALE_MODE,
		frameWidth: rawMeta.frameWidth ?? DEFAULT_FRAME_WIDTH,
		frameHeight: rawMeta.frameHeight ?? DEFAULT_FRAME_HEIGHT,
		placement: resolvePlacement(rawMeta.placement),
		role: rawMeta.role ?? null,
		name: rawMeta.name ?? null
	};
}

/**
 * Resolve playback mode from raw metadata, handling the legacy `loop` boolean.
 * @param {Object} rawMeta
 * @returns {string}
 */
function resolvePlayback(rawMeta) {
	if (typeof rawMeta.playback === 'string' && PLAYBACK_MODES.includes(rawMeta.playback)) {
		return rawMeta.playback;
	}
	if (rawMeta.loop === false) {
		return 'once';
	}
	return DEFAULT_PLAYBACK;
}

/**
 * Preset beat counts for syncLength values.
 * Sub-beat/beat presets map directly; bar presets use beatsPerBar.
 */
const PRESET_BEATS = {
	'1/4 beat': 0.25,
	'1/2 beat': 0.5,
	'1 beat': 1,
	'2 beats': 2
};

/**
 * Bar-based preset multipliers (multiplied by beatsPerBar).
 */
const PRESET_BARS = {
	'1 bar': 1,
	'2 bars': 2,
	'4 bars': 4,
	'8 bars': 8
};

/**
 * Resolve frameDurationBeats from sync fields, or return the explicit value.
 *
 * - If `frameDurationBeats` is already set, it takes precedence (explicit authoring wins).
 * - If `sync === 'beat'`, expand sync fields into a per-frame beats array.
 * - Otherwise return the raw value (null if absent).
 *
 * @param {Object} rawMeta
 * @param {number|null} frames
 * @returns {number|number[]|null}
 */
function resolveFrameDurationBeats(rawMeta, frames) {
	if (rawMeta.frameDurationBeats !== undefined && rawMeta.frameDurationBeats !== null) {
		return rawMeta.frameDurationBeats;
	}
	if (rawMeta.sync !== 'beat' || !frames) {
		return rawMeta.frameDurationBeats ?? null;
	}
	return expandSyncToFrameDurationBeats(rawMeta, frames);
}

/**
 * Expand sync fields into a per-frame beats array.
 *
 * Algorithm:
 * 1. Resolve total beats from syncLength preset or custom syncBeats.
 * 2. Compute per-frame weights from frameRatesForFrames (1/fps) or uniform (1).
 * 3. Normalize weights to sum to 1, multiply by totalBeats.
 *
 * @param {Object} rawMeta
 * @param {number} frames
 * @returns {number[]}
 */
function expandSyncToFrameDurationBeats(rawMeta, frames) {
	const totalBeats = resolveTotalBeats(rawMeta);
	if (totalBeats === null) {
		return null;
	}

	const weights = computeFrameWeights(rawMeta, frames);
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

	return weights.map(weight => (weight / totalWeight) * totalBeats);
}

/**
 * Resolve total beats for the clip from syncLength preset or custom syncBeats.
 * @param {Object} rawMeta
 * @returns {number|null}
 */
function resolveTotalBeats(rawMeta) {
	const { syncLength, syncBeats, beatsPerBar } = rawMeta;

	if (syncLength === 'custom') {
		if (typeof syncBeats !== 'number' || syncBeats <= 0) {
			return null;
		}
		return syncBeats;
	}

	if (syncLength in PRESET_BEATS) {
		return PRESET_BEATS[syncLength];
	}

	if (syncLength in PRESET_BARS) {
		const effectiveBeatsPerBar = typeof beatsPerBar === 'number' && beatsPerBar > 0 ? beatsPerBar : DEFAULT_BEATS_PER_BAR;
		return PRESET_BARS[syncLength] * effectiveBeatsPerBar;
	}

	return null;
}

/**
 * Compute per-frame weights from frameRatesForFrames.
 * Frames with an FPS entry get weight 1/fps; others get weight 1 (uniform).
 * @param {Object} rawMeta
 * @param {number} frames
 * @returns {number[]}
 */
function computeFrameWeights(rawMeta, frames) {
	const frameRates = rawMeta.frameRatesForFrames ?? {};
	const weights = [];
	for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
		const fps = frameRates[frameIndex];
		weights.push(typeof fps === 'number' && fps > 0 ? 1 / fps : 1);
	}
	return weights;
}

/**
 * Resolve placement from raw metadata, ensuring integer pixel values.
 * @param {unknown} rawPlacement
 * @returns {{ x: number, y: number }}
 */
function resolvePlacement(rawPlacement) {
	if (!rawPlacement || typeof rawPlacement !== 'object' || Array.isArray(rawPlacement)) {
		return { ...DEFAULT_PLACEMENT };
	}
	const x = Math.floor(Number(rawPlacement.x) || 0);
	const y = Math.floor(Number(rawPlacement.y) || 0);
	return { x, y };
}
