/**
 * Beat-sync expansion helpers for mainframe live preview / authoring.
 *
 * Mirrors `akvj/src/js/visuals/clipMetadata.js` (`resolveFrameDurationBeats` /
 * `expandSyncToFrameDurationBeats`). No cross-realm import — keep in sync manually.
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

/** Default BPM for converting beat-synced preview durations to milliseconds.
 * Mirrors `settings.bpm.default` (120) in akvj — no MIDI clock / no BPM CC fallback. */
export const PREVIEW_SYNC_BPM = 120;

const MS_PER_MINUTE = 60000;

/**
 * Resolve frameDurationBeats from sync fields, or return the explicit value.
 * Explicit `frameDurationBeats` wins over sync expansion.
 *
 * @param {Object} rawMeta
 * @param {number|null} frames
 * @returns {number|number[]|null}
 */
export function resolveFrameDurationBeats(rawMeta, frames) {
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
 * @param {Object} rawMeta
 * @param {number} frames
 * @returns {number[]|null}
 */
export function expandSyncToFrameDurationBeats(rawMeta, frames) {
	const totalBeats = resolveTotalBeats(rawMeta);
	if (totalBeats === null) {
		return null;
	}

	const weights = computeFrameWeights(rawMeta, frames);
	const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
	if (!(totalWeight > 0)) {
		return null;
	}

	return weights.map(weight => (weight / totalWeight) * totalBeats);
}

/**
 * @param {Object} rawMeta
 * @returns {number|null}
 */
export function resolveTotalBeats(rawMeta) {
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
 * @param {Object} rawMeta
 * @param {number} frames
 * @returns {number[]}
 */
function computeFrameWeights(rawMeta, frames) {
	const frameRates = rawMeta.frameRatesForFrames ?? {};
	const weights = [];
	for (let frameIndex = 0; frameIndex < frames; frameIndex++) {
		const fps = frameRates[frameIndex] ?? frameRates[String(frameIndex)];
		weights.push(typeof fps === 'number' && fps > 0 ? 1 / fps : 1);
	}
	return weights;
}

/**
 * Convert per-frame beats to wall-clock ms for StagingPreview (fixed preview BPM).
 * @param {number[]} beatsPerFrame
 * @param {number} [bpm=120]
 * @returns {number[]}
 */
export function frameDurationBeatsToPreviewMs(beatsPerFrame, bpm = PREVIEW_SYNC_BPM) {
	const safeBpm = Number.isFinite(bpm) && bpm > 0 ? bpm : PREVIEW_SYNC_BPM;
	return beatsPerFrame.map(beats => {
		const value = Number(beats);
		if (!Number.isFinite(value) || value <= 0) {
			return MS_PER_MINUTE / safeBpm;
		}
		return (value * MS_PER_MINUTE) / safeBpm;
	});
}
