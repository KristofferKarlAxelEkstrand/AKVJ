/**
 * Barrel export for mainframe shared constants and helpers (server + browser + pipeline).
 */
export { CLIP_ID_PATTERN, SAFE_PNG_NAME, isValidClipId } from './clipId.js';
export { DEFAULT_PROJECT_ID } from './projects.js';
export { msToFps, fpsToMs, durationsMsToFrameRates, DEFAULT_FRAME_DURATION_MS, DEFAULT_FALLBACK_FRAME_DURATION_MS, DEFAULT_FALLBACK_FPS } from './frameTiming.js';
export { SCALE_MODES, DEFAULT_SCALE_MODE, resolveScaleMode, computeFrameDrawRect } from './frameFit.js';
export { FRAME_BAKE_SCALE_MODES, resolveFrameBakeConfig, frameBakeConfigsEqual, areFrameBakeConfigsUniform } from './frameBake.js';
export { DEFAULT_FRAME_WIDTH, DEFAULT_FRAME_HEIGHT, DEFAULT_PLACEMENT, resolvePlacement, PLAYBACK_MODE, PLAYBACK_MODES, DEFAULT_PLAYBACK, TRIGGER_TYPES, DEFAULT_TRIGGER_TYPE, resolveTriggerType, DEFAULT_FRAME_RATE, MAX_FRAMES_PER_ROW, VALID_BIT_DEPTHS } from './clipSchema.js';
