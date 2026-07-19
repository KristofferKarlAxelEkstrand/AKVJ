/**
 * Beat-sync resolution helpers for mainframe live preview / authoring.
 *
 * Mirrors `akvj/src/js/visuals/clipMetadata.js` (`resolveSyncBeats`).
 * No cross-realm import — keep in sync manually.
 */
import { DEFAULT_BEATS_PER_BAR } from './clipSchema.js';

const PRESET_BEATS = {
	'1/4 beat': 0.25,
	'1/2 beat': 0.5,
	'1 beat': 1,
	'2 beats': 2
};

const PRESET_BARS = {
	'1 bar': 1,
	'2 bars': 2,
	'4 bars': 4,
	'8 bars': 8
};

/**
 * Resolve the total synced duration in beats for `sync: "beat"` clips.
 *
 * Mirrors akvj's `resolveSyncBeats` function. Returns a single number representing
 * total beats, not a per-frame array. The engine handles per-frame timing via
 * `frameRatesForFrames` and a speed multiplier.
 *
 * - `sync` !== 'beat' (including the default 'free') → null (no sync).
 * - `syncLength` is a preset → beats computed from the preset (bar presets use `beatsPerBar`).
 * - `syncLength` is 'custom' → the author-provided `syncBeats` is used directly.
 * - Invalid/missing `syncLength`, or 'custom' without a positive `syncBeats` → null.
 *
 * @param {Object} rawMeta
 * @returns {number|null}
 */
export function resolveSyncBeats(rawMeta) {
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
