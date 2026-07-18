/**
 * Shared ms ↔ FPS helpers for clip frame timing.
 * `<clip-frames>` durations and GIF delays are milliseconds; `frameRatesForFrames` is FPS.
 */

export const DEFAULT_FALLBACK_FPS = 12;

/**
 * @param {unknown} delayMs
 * @param {number} [fallbackFps=12]
 * @returns {number}
 */
export function msToFps(delayMs, fallbackFps = DEFAULT_FALLBACK_FPS) {
	const ms = Number(delayMs);
	const fallback = Number.isFinite(fallbackFps) && fallbackFps > 0 ? fallbackFps : DEFAULT_FALLBACK_FPS;
	if (!Number.isFinite(ms) || ms <= 0) {
		return fallback;
	}
	return 1000 / ms;
}

/**
 * @param {unknown} fps
 * @param {number} [fallbackMs]
 * @returns {number}
 */
export function fpsToMs(fps, fallbackMs = 1000 / DEFAULT_FALLBACK_FPS) {
	const rate = Number(fps);
	const fallback = Number.isFinite(fallbackMs) && fallbackMs > 0 ? fallbackMs : 1000 / DEFAULT_FALLBACK_FPS;
	if (!Number.isFinite(rate) || rate <= 0) {
		return fallback;
	}
	return 1000 / rate;
}

/**
 * Build a `frameRatesForFrames` object from millisecond durations (current frame order).
 * @param {unknown[]} durationsMs
 * @param {number} [fallbackFps=12]
 * @returns {Record<string, number>}
 */
export function durationsMsToFrameRates(durationsMs, fallbackFps = DEFAULT_FALLBACK_FPS) {
	const rates = {};
	if (!Array.isArray(durationsMs)) {
		return rates;
	}
	for (let i = 0; i < durationsMs.length; i++) {
		rates[String(i)] = msToFps(durationsMs[i], fallbackFps);
	}
	return rates;
}
