/**
 * Timing conversion utilities for ms ↔ FPS.
 *
 * Provides bidirectional conversion between milliseconds-per-frame and frames-per-second
 * to support backward compatibility with frameRatesForFrames while transitioning to
 * frameDurationsMs. Mirrors mainframe's frameTiming.js functionality without shared imports.
 */

import { MS_PER_SECOND } from '../utils/timing.js';

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
 * @param {number} frameRate - Frames per second
 * @returns {number} Duration in milliseconds per frame
 * @throws {Error} If frameRate is not a positive number
 */
export function fpsToMs(frameRate) {
	if (typeof frameRate !== 'number' || frameRate <= 0) {
		throw new Error(`fpsToMs: frameRate must be a positive number, got ${frameRate}`);
	}
	return MS_PER_SECOND / frameRate;
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
	for (const [frameIndex, frameRate] of Object.entries(frameRatesForFrames)) {
		if (typeof frameRate === 'number' && frameRate > 0) {
			frameDurationsMs[frameIndex] = fpsToMs(frameRate);
		}
	}
	return frameDurationsMs;
}
