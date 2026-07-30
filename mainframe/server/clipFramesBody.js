import { durationsMsToFrameRates } from '../shared/frameTiming.js';

/**
 * Decode base64 / data-URL image strings to Buffers.
 * @param {unknown[]} frames
 * @returns {Buffer[]}
 */
export function decodeFrameBase64(frames) {
	return frames.map(frame => Buffer.from(String(frame).replace(/^data:image\/\w+;base64,/, ''), 'base64'));
}

/**
 * Parse clip create/update JSON body into spritesheet options + frame buffers.
 * `frameDurationsMs` is the source of truth when present; `frameRatesForFrames` is derived for legacy readers.
 * @param {object} body
 * @returns {{
 *   role: unknown,
 *   frameBuffers: Buffer[]|null,
 *   targetWidth: unknown,
 *   targetHeight: unknown,
 *   name: unknown,
 *   playback: unknown,
 *   frameRate: unknown,
 *   scaleMode: unknown,
 *   scaling: unknown,
 *   frameDurationsMs: number[]|undefined,
 *   frameRatesForFrames: Record<string, number>|undefined,
 *   retrigger: unknown,
 *   triggerType: unknown,
 *   triggerGroup: unknown,
 *   bitDepth: unknown
 * }}
 */
export function parseClipFramesBody(body) {
	const { role, frames, targetWidth, targetHeight, name, playback, frameRate, scaleMode, frameDurationsMs, retrigger, triggerType, triggerGroup, bitDepth, sync, syncLength, syncBeats, beatsPerBar, placement, scaling, frameBakeConfigs } = body ?? {};
	const frameBuffers = Array.isArray(frames) && frames.length > 0 ? decodeFrameBase64(frames) : null;
	const durationsMs = Array.isArray(frameDurationsMs) && frameDurationsMs.length > 0 ? frameDurationsMs.map(ms => Number(ms)) : undefined;
	const frameRatesForFrames = durationsMs ? durationsMsToFrameRates(durationsMs) : undefined;
	return {
		role,
		frameBuffers,
		targetWidth,
		targetHeight,
		name,
		playback,
		frameRate,
		scaleMode,
		frameDurationsMs: durationsMs,
		frameRatesForFrames,
		retrigger,
		triggerType,
		triggerGroup,
		bitDepth,
		sync,
		syncLength,
		syncBeats,
		beatsPerBar,
		placement,
		scaling,
		frameBakeConfigs: Array.isArray(frameBakeConfigs) ? frameBakeConfigs : undefined
	};
}
