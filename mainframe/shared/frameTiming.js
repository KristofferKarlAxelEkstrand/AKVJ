/**
 * Shared ms ↔ FPS helpers for clip frame timing.
 * `<clip-frames>` durations and GIF delays are milliseconds; `frameRatesForFrames` is FPS.
 */

import { DEFAULT_FRAME_RATE } from './clipSchema.js';

const MS_PER_SECOND = 1000;

export const DEFAULT_FRAME_DURATION_MS = MS_PER_SECOND;
export const DEFAULT_FALLBACK_FRAME_DURATION_MS = MS_PER_SECOND / DEFAULT_FRAME_RATE;
/** Default FPS used when converting missing rates/delays to milliseconds. */
export const DEFAULT_FALLBACK_FPS = DEFAULT_FRAME_RATE;

/**
 * @param {unknown} durationMs
 * @param {number} [fallbackFrameRate=DEFAULT_FRAME_RATE]
 * @returns {number}
 */
export function msToFps(durationMs, fallbackFrameRate = DEFAULT_FRAME_RATE) {
	const ms = Number(durationMs);
	const fallback = Number.isFinite(fallbackFrameRate) && fallbackFrameRate > 0 ? fallbackFrameRate : DEFAULT_FRAME_RATE;
	if (!Number.isFinite(ms) || ms <= 0) {
		return fallback;
	}
	return MS_PER_SECOND / ms;
}

/**
 * @param {unknown} fps
 * @param {number} [fallbackMs]
 * @returns {number}
 */
export function fpsToMs(fps, fallbackMs = MS_PER_SECOND / DEFAULT_FRAME_RATE) {
	const rate = Number(fps);
	const fallback = Number.isFinite(fallbackMs) && fallbackMs > 0 ? fallbackMs : MS_PER_SECOND / DEFAULT_FRAME_RATE;
	if (!Number.isFinite(rate) || rate <= 0) {
		return fallback;
	}
	return MS_PER_SECOND / rate;
}

/**
 * Build a `frameRatesForFrames` object from millisecond durations (current frame order).
 * @param {unknown[]} durationsMs
 * @param {number} [fallbackFrameRate=DEFAULT_FRAME_RATE]
 * @returns {Record<string, number>}
 */
export function durationsMsToFrameRates(durationsMs, fallbackFrameRate = DEFAULT_FRAME_RATE) {
	const rates = {};
	if (!Array.isArray(durationsMs)) {
		return rates;
	}
	for (let i = 0; i < durationsMs.length; i++) {
		rates[String(i)] = msToFps(durationsMs[i], fallbackFrameRate);
	}
	return rates;
}
