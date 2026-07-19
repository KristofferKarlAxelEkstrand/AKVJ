/**
 * Timing conversion utilities for ms ↔ FPS.
 *
 * Provides bidirectional conversion between milliseconds-per-frame and frames-per-second
 * to support backward compatibility with frameRatesForFrames while transitioning to
 * frameDurationsMs. Mirrors mainframe's frameTiming.js functionality without shared imports.
 */

const MS_PER_SECOND = 1000;

/**
 * Convert milliseconds per frame to frames per second.
 * @param {number} durationMs - Duration in milliseconds per frame
 * @returns {number} Frames per second
 * @throws {Error} If durationMs is not a positive number
 */
export function msToFps(durationMs) {
	if (typeof durationMs !== 'number' || durationMs <= 0) {
		throw new Error(`msToFps: durationMs must be a positive number, got ${durationMs}`);
	}
	return MS_PER_SECOND / durationMs;
}

/**
 * Convert frames per second to milliseconds per frame.
 * @param {number} fps - Frames per second
 * @returns {number} Duration in milliseconds per frame
 * @throws {Error} If fps is not a positive number
 */
export function fpsToMs(fps) {
	if (typeof fps !== 'number' || fps <= 0) {
		throw new Error(`fpsToMs: fps must be a positive number, got ${fps}`);
	}
	return MS_PER_SECOND / fps;
}

/**
 * Convert a frame index → ms per frame mapping to frame index → FPS mapping.
 * @param {Object} frameDurationsMs - Frame index → ms per frame mapping
 * @returns {Object} Frame index → FPS mapping
 */
export function durationsMsToFrameRates(frameDurationsMs) {
	if (!frameDurationsMs || typeof frameDurationsMs !== 'object') {
		return {};
	}

	const frameRatesForFrames = {};
	for (const [frameIndex, durationMs] of Object.entries(frameDurationsMs)) {
		if (typeof durationMs === 'number' && durationMs > 0) {
			frameRatesForFrames[frameIndex] = msToFps(durationMs);
		}
	}
	return frameRatesForFrames;
}

/**
 * Convert a frame index → FPS mapping to frame index → ms per frame mapping.
 * @param {Object} frameRatesForFrames - Frame index → FPS mapping
 * @returns {Object} Frame index → ms per frame mapping
 */
export function frameRatesToDurationsMs(frameRatesForFrames) {
	if (!frameRatesForFrames || typeof frameRatesForFrames !== 'object') {
		return {};
	}

	const frameDurationsMs = {};
	for (const [frameIndex, fps] of Object.entries(frameRatesForFrames)) {
		if (typeof fps === 'number' && fps > 0) {
			frameDurationsMs[frameIndex] = fpsToMs(fps);
		}
	}
	return frameDurationsMs;
}
