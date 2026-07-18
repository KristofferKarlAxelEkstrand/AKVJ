import { durationsMsToFrameRates } from '../shared/frameTiming.js';

/**
 * Decode base64 / data-URL image strings to Buffers.
 * @param {unknown[]} frames
 * @returns {Buffer[]}
 */
export function decodeFrameDataUrls(frames) {
	return frames.map(frame => Buffer.from(String(frame).replace(/^data:image\/\w+;base64,/, ''), 'base64'));
}

/**
 * Parse clip create/update JSON body into spritesheet options + frame buffers.
 * @param {object} body
 * @returns {{
 *   role: unknown,
 *   frames: unknown,
 *   frameBuffers: Buffer[]|null,
 *   targetWidth: unknown,
 *   targetHeight: unknown,
 *   name: unknown,
 *   playback: unknown,
 *   frameRate: unknown,
 *   scaleMode: unknown,
 *   frameRatesForFrames: Record<string, number>|undefined,
 *   retrigger: unknown,
 *   triggerType: unknown,
 *   triggerGroup: unknown,
 *   bitDepth: unknown,
 *   frameDurationBeats: unknown
 * }}
 */
export function parseClipFramesBody(body) {
	const {
		role,
		frames,
		targetWidth,
		targetHeight,
		name,
		playback,
		frameRate,
		scaleMode,
		frameDurations,
		retrigger,
		triggerType,
		triggerGroup,
		bitDepth,
		frameDurationBeats,
		sync,
		syncLength,
		syncBeats,
		beatsPerBar
	} = body ?? {};
	const frameBuffers = Array.isArray(frames) && frames.length > 0 ? decodeFrameDataUrls(frames) : null;
	const frameRatesForFrames = Array.isArray(frameDurations) && frameDurations.length > 0 ? durationsMsToFrameRates(frameDurations) : undefined;
	return {
		role,
		frames,
		frameBuffers,
		targetWidth,
		targetHeight,
		name,
		playback,
		frameRate,
		scaleMode,
		frameRatesForFrames,
		retrigger,
		triggerType,
		triggerGroup,
		bitDepth,
		frameDurationBeats,
		sync,
		syncLength,
		syncBeats,
		beatsPerBar
	};
}
