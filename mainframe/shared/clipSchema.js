/**
 * Clip schema constants — single source of truth for mainframe.
 *
 * Mirrors the engine-side constants in `akvj/src/js/visuals/clipMetadata.js`.
 * No shared JS import between realms; both modules must be kept in sync manually.
 */

/** Default clip frame dimensions (AKVJ canvas resolution). */
export const DEFAULT_FRAME_WIDTH = 240;
export const DEFAULT_FRAME_HEIGHT = 135;

/** Default scale mode for clip frames. */
export const DEFAULT_SCALE_MODE = 'fit';

/** Canonical playback modes supported by the engine. */
export const PLAYBACK_MODES = Object.freeze(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);

/** Default playback mode when none is specified. */
export const DEFAULT_PLAYBACK = 'loop';

/** Supported trigger types. */
export const TRIGGER_TYPES = Object.freeze(['momentary', 'latch', 'one-shot']);

/** Default trigger type when none is specified. */
export const DEFAULT_TRIGGER_TYPE = 'momentary';

/** Default frame rate (FPS). */
export const DEFAULT_FRAME_RATE = 12;

/** Maximum frames per row in a spritesheet. */
export const MAX_FRAMES_PER_ROW = 16;

/** Valid bit depths for bitmask clips. */
export const VALID_BIT_DEPTHS = Object.freeze([1, 2, 4, 8]);

/** Sync modes for clip timing. */
export const SYNC_MODES = Object.freeze(['free', 'beat']);

/** Default sync mode. */
export const DEFAULT_SYNC_MODE = 'free';

/** Preset length strings for beat-synced clips. */
export const SYNC_LENGTH_PRESETS = Object.freeze(['1/4 beat', '1/2 beat', '1 beat', '2 beats', '1 bar', '2 bars', '4 bars', '8 bars', 'custom']);

/** Default beats per bar (4/4 time). */
export const DEFAULT_BEATS_PER_BAR = 4;
