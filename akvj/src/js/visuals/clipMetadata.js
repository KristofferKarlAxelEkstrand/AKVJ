/**
 * Clip metadata normalization — single source of truth for reading meta.json.
 *
 * Handles legacy field aliases (`numberOfFrames` → `frames`, `loop` → `playback`)
 * and provides sensible defaults so downstream code never needs to duplicate
 * the `frames ?? numberOfFrames` or `playback ?? (loop === false ? 'once' : 'loop')` logic.
 */

/**
 * Canonical playback modes supported by the engine.
 * @readonly
 * @enum {string}
 */
export const PLAYBACK_MODE = Object.freeze({
	ONCE: 'once',
	LOOP: 'loop',
	PINGPONG: 'pingpong',
	RANDOM: 'random',
	REVERSE: 'reverse',
	SHUFFLE: 'shuffle',
	SCRUB: 'scrub'
});

/**
 * Canonical playback modes as a list, for validation and defaulting.
 * @type {readonly string[]}
 */
export const PLAYBACK_MODES = Object.freeze(Object.values(PLAYBACK_MODE));

/**
 * Safe-id pattern shared by clip ids and project ids.
 * Same rule as `mainframe/shared/clipId.js` (no cross-package import).
 */
export const SAFE_ID_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

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
 * Default scaling (interpolation) for clip frames.
 */
export const DEFAULT_SCALING = 'nearest';

/**
 * Supported scaling (interpolation) modes.
 */
export const SCALING_MODES = Object.freeze(['nearest', 'smooth']);

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
 * - `frameDurationsMs` takes priority; falls back to `frameRatesForFrames`
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

	const syncBeats = resolveSyncBeats(rawMeta);
	const { frameDurationsMs, frameRatesForFrames } = resolveFrameTiming(rawMeta);

	const scaling = SCALING_MODES.includes(rawMeta.scaling) ? rawMeta.scaling : DEFAULT_SCALING;

	return {
		png: rawMeta.png ?? 'sprite.png',
		frames,
		framesPerRow: rawMeta.framesPerRow ?? null,
		playback,
		frameDurationsMs,
		frameRatesForFrames,
		syncBeats,
		retrigger: rawMeta.retrigger ?? true,
		bitDepth: rawMeta.bitDepth ?? null,
		triggerType: rawMeta.triggerType ?? DEFAULT_TRIGGER_TYPE,
		triggerGroup: rawMeta.triggerGroup ?? null,
		scaleMode: rawMeta.scaleMode ?? DEFAULT_SCALE_MODE,
		scaling,
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
		return PLAYBACK_MODE.ONCE;
	}
	return DEFAULT_PLAYBACK;
}

/**
 * Resolve frame timing from raw metadata, giving priority to ms-based durations.
 *
 * - `frameDurationsMs` (object or array of ms per frame) is normalized to a
 *   `{frameIndex: ms}` object and wins over `frameRatesForFrames`
 * - Falls back to `frameRatesForFrames` (object with frame index → FPS)
 * - Both null if neither is provided or if all entries are invalid
 *
 * @param {Object} rawMeta
 * @returns {{frameDurationsMs: Object|null, frameRatesForFrames: Object|null}}
 */
function resolveFrameTiming(rawMeta) {
	const rawMs = rawMeta.frameDurationsMs;
	if (isFrameDurationsMsCandidate(rawMs)) {
		const frameDurationsMs = resolveFrameDurationsMs(rawMs);
		return { frameDurationsMs, frameRatesForFrames: null };
	}

	return { frameDurationsMs: null, frameRatesForFrames: resolveFrameRatesForFrames(rawMeta) };
}

/**
 * @param {unknown} value
 * @returns {boolean}
 */
function isFrameDurationsMsCandidate(value) {
	return value !== null && typeof value === 'object';
}

/**
 * Normalize a `frameDurationsMs` value to a `{frameIndex: ms}` object.
 * Skips invalid, zero, and negative entries.
 *
 * @param {Object|Array} raw
 * @returns {Object|null}
 */
function resolveFrameDurationsMs(raw) {
	const result = {};

	if (Array.isArray(raw)) {
		for (let i = 0; i < raw.length; i++) {
			if (typeof raw[i] === 'number' && Number.isFinite(raw[i]) && raw[i] > 0) {
				result[i] = raw[i];
			}
		}
	} else {
		for (const [key, value] of Object.entries(raw)) {
			const frameIndex = Number(key);
			if (!Number.isInteger(frameIndex) || frameIndex < 0) {
				continue;
			}
			if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
				result[frameIndex] = value;
			}
		}
	}

	return Object.keys(result).length > 0 ? result : null;
}

/**
 * Resolve FPS-based frame timing from raw metadata.
 * Skips invalid, zero, and negative entries.
 *
 * @param {Object} rawMeta
 * @returns {Object|null}
 */
function resolveFrameRatesForFrames(rawMeta) {
	const raw = rawMeta.frameRatesForFrames;
	if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
		return null;
	}

	const result = {};
	for (const [key, value] of Object.entries(raw)) {
		const frameIndex = Number(key);
		if (!Number.isInteger(frameIndex) || frameIndex < 0) {
			continue;
		}
		if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
			result[frameIndex] = value;
		}
	}

	return Object.keys(result).length > 0 ? result : null;
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
 * Resolve the total synced duration in beats for `sync: "beat"` clips.
 *
 * `syncBeats` is the resolved runtime value ClipTiming consumes — never `syncLength`
 * (the author-facing preset string). `frameRatesForFrames` timing is preserved as-is
 * and scaled by ClipTiming via a speed multiplier; this function only resolves the
 * clip's total musical length.
 *
 * - `sync` !== 'beat' (including the default 'free') → null (no sync).
 * - `syncLength` is a preset → beats computed from the preset (bar presets use `beatsPerBar`).
 * - `syncLength` is 'custom' → the author-provided `syncBeats` is used directly.
 * - Invalid/missing `syncLength`, or 'custom' without a positive `syncBeats` → null.
 *
 * @param {Object} rawMeta
 * @returns {number|null}
 */
function resolveSyncBeats(rawMeta) {
	if (rawMeta.sync !== 'beat') {
		return null;
	}

	const { syncLength, syncBeats, beatsPerBar } = rawMeta;

	if (syncLength === 'custom') {
		return typeof syncBeats === 'number' && syncBeats > 0 ? syncBeats : null;
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
