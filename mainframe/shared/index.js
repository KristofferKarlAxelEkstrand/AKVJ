/**
 * Barrel export for mainframe shared constants and helpers (server + browser + pipeline).
 */
export { CLIP_ID_PATTERN, SAFE_PNG_NAME, isValidClipId } from './clipId.js';
export { DEFAULT_FALLBACK_FPS, msToFps, fpsToMs, durationsMsToFrameRates } from './frameTiming.js';
export { SCALE_MODES, DEFAULT_SCALE_MODE, resolveScaleMode, computeFrameDrawRect } from './frameFit.js';
export {
	DEFAULT_FRAME_WIDTH,
	DEFAULT_FRAME_HEIGHT,
	PLAYBACK_MODES,
	DEFAULT_PLAYBACK,
	TRIGGER_TYPES,
	DEFAULT_TRIGGER_TYPE,
	DEFAULT_FRAME_RATE,
	MAX_FRAMES_PER_ROW,
	VALID_BIT_DEPTHS
} from './clipSchema.js';
