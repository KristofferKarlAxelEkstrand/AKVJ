/**
 * Clip - Thin render facade for individual sprite clip playback and rendering.
 *
 * Delegates timing to ClipTiming and frame advancement to PlaybackController.
 * Manages image dimensions, canvas drawing, and clip lifecycle (reset/stop/destroy).
 */
import settings from '../core/settings.js';
import ClipTiming from './ClipTiming.js';
import PlaybackController from './PlaybackController.js';
import { MAX_PATTERN_TILES_PER_FRAME, drawPattern, drawStretch, drawWithScaleMode } from './clipDrawRect.js';
import { DEFAULT_SCALING, SCALING_MODES } from './clipMetadata.js';

export { MAX_PATTERN_TILES_PER_FRAME };

class Clip {
	// Configuration (immutable after construction)
	#image;
	#frameCount;
	#framesPerRow;
	#frameWidth;
	#frameHeight;
	#shouldRetrigger;
	#bitDepth;
	#canvasWidth;
	#canvasHeight;
	#scaleMode;
	#scaling;
	#placement;

	// Trigger behavior (private, accessed via getters)
	#triggerType = 'momentary';
	#triggerGroup = null;

	// Delegated helpers
	#timing;
	#playback;

	// Render state
	#lastRenderTimestamp = null;

	/**
	 * @param {Object} options
	 * @param {HTMLImageElement} options.image
	 * @param {number} options.frames
	 * @param {number} options.framesPerRow
	 * @param {string} [options.playback='loop']
	 * @param {Object} [options.frameRatesForFrames={ 0: 1 }]
	 * @param {Object|null} [options.frameDurationsMs=null] - Frame index → ms per frame (takes priority over frameRatesForFrames)
	 * @param {number|null} [options.syncBeats=null] - Total clip duration in beats for
	 *   `sync: "beat"` clips; ignored for 'random'/'shuffle' playback (sync doesn't apply)
	 * @param {boolean} [options.retrigger=true]
	 * @param {number|null} [options.bitDepth=null]
	 * @param {string} [options.triggerType='momentary']
	 * @param {string|number|null} [options.triggerGroup=null]
	 * @param {string} [options.scaleMode='fit']
	 * @param {string} [options.scaling='nearest'] - Interpolation mode ('nearest' | 'smooth')
	 * @param {{ x: number, y: number }} [options.placement={ x: 0, y: 0 }]
	 * @param {() => number} [options.bpmProvider] - Injected BPM provider for testability
	 * @param {{ bpmSource: string, subscribe: Function }} [options.clockSource] - Injected clock source for testability
	 */
	constructor({ image, frames, framesPerRow, playback = 'loop', frameRatesForFrames = { 0: 1 }, frameDurationsMs = null, syncBeats = null, retrigger = true, bitDepth = null, triggerType = 'momentary', triggerGroup = null, scaleMode = 'fit', scaling = DEFAULT_SCALING, placement = { x: 0, y: 0 }, bpmProvider, clockSource }) {
		this.#validateConstructorParams(frames, framesPerRow);
		this.#initCoreFields(image, frames, framesPerRow, bitDepth);
		this.#initDimensions(image, frames, framesPerRow);
		this.#shouldRetrigger = retrigger;
		this.#triggerType = triggerType;
		this.#triggerGroup = triggerGroup;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		this.#scaleMode = scaleMode;
		this.#scaling = SCALING_MODES.includes(scaling) ? scaling : DEFAULT_SCALING;
		this.#placement = placement;

		// Sync does not apply to non-deterministic playback modes — never engage
		// clock-driven progress tracking for them, regardless of clip metadata.
		const isNonDeterministic = playback === 'random' || playback === 'shuffle';
		this.#timing = new ClipTiming({ frameRatesForFrames, frameDurationsMs, syncBeats: isNonDeterministic ? null : syncBeats, frames, bpmProvider, clockSource });
		this.#playback = new PlaybackController({ frames, playback });
	}

	#validateConstructorParams(frames, framesPerRow) {
		if (!frames || frames < 1) {
			throw new Error('Clip requires frames >= 1');
		}
		if (!framesPerRow || framesPerRow < 1) {
			throw new Error('Clip requires framesPerRow >= 1');
		}
	}

	#initCoreFields(image, frames, framesPerRow, bitDepth) {
		this.#image = image;
		this.#frameCount = frames;
		this.#framesPerRow = framesPerRow;
		this.#bitDepth = bitDepth;
	}

	#initDimensions(image, frames, framesPerRow) {
		this.#frameWidth = image.width / framesPerRow;
		this.#frameHeight = image.height / Math.ceil(frames / framesPerRow);
		if (!this.#frameWidth || !this.#frameHeight) {
			throw new Error('Clip: Invalid image dimensions');
		}
	}

	/**
	 * Internal render step: advance frame and draw to the provided context.
	 * Guards against double-rendering when called with the same timestamp.
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} timestamp
	 */
	#renderFrame(ctx, timestamp) {
		if (this.#playback.isFinished || !this.#image) {
			return;
		}
		if (this.#lastRenderTimestamp === timestamp) {
			return;
		}
		this.#advanceFrame(timestamp);
		this.#drawToContext(ctx);
		this.#lastRenderTimestamp = timestamp;
	}

	/**
	 * Render the current clip frame to a specific context.
	 * @param {CanvasRenderingContext2D} ctx
	 * @param {number} [timestamp]
	 */
	renderToContext(ctx, timestamp = performance.now()) {
		this.#renderFrame(ctx, timestamp);
	}

	/**
	 * Advance the clip frame based on elapsed time or clock pulses.
	 * @param {number} timestamp
	 */
	#advanceFrame(timestamp) {
		this.#timing.setCurrentFrameIndex(this.#playback.frame);
		this.#timing.advanceFrame(timestamp, () => this.#advanceNextFrame());
	}

	/**
	 * Advance to the next frame via the playback controller.
	 * @returns {boolean}
	 */
	#advanceNextFrame() {
		const playbackContinues = this.#advancePlayback();
		this.#timing.setCurrentFrameIndex(this.#playback.frame);
		return playbackContinues;
	}

	/**
	 * Advance playback and handle clock unsubscribe on finish.
	 * @returns {boolean}
	 */
	#advancePlayback() {
		const playbackContinues = this.#playback.advance();
		if (!playbackContinues) {
			this.#timing.unsubscribeFromClock();
		}
		return playbackContinues;
	}

	/**
	 * Advance via clock-driven progress (0.0-1.0 through the clip's synced
	 * duration), used instead of step-based advancement while a MIDI clock is
	 * actively driving a beat-synced clip.
	 * @param {number} progress
	 * @returns {boolean} True if playback continues, false once finished
	 */
	#advanceByProgress(progress) {
		this.#playback.setLinearProgress(progress);
		this.#timing.setCurrentFrameIndex(this.#playback.frame);
		if (this.#playback.isFinished) {
			this.#timing.unsubscribeFromClock();
			return false;
		}
		return true;
	}

	/**
	 * Draw the current frame to a canvas context using scaleMode + placement.
	 * @param {CanvasRenderingContext2D} ctx
	 */
	#drawToContext(ctx) {
		if (!this.#image || !ctx || this.#playback.isFinished) {
			return;
		}

		const isSmooth = this.#scaling === 'smooth';
		ctx.imageSmoothingEnabled = isSmooth;
		ctx.imageSmoothingQuality = isSmooth ? 'high' : settings.rendering.imageSmoothingQuality;

		const drawFrame = Math.min(this.#playback.frame, this.#frameCount - 1);
		const frameRow = Math.floor(drawFrame / this.#framesPerRow);
		const frameColumn = drawFrame - frameRow * this.#framesPerRow;
		const sourceX = this.#frameWidth * frameColumn;
		const sourceY = this.#frameHeight * frameRow;

		if (this.#scaleMode === 'pattern') {
			drawPattern(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight, this.#placement);
		} else if (this.#scaleMode === 'stretch') {
			drawStretch(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight);
		} else {
			drawWithScaleMode(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight, this.#scaleMode, this.#placement);
		}
	}

	/**
	 * Whether this clip is completed and won't draw anymore.
	 * @returns {boolean}
	 */
	get isFinished() {
		return this.#playback.isFinished;
	}

	/**
	 * Get the bit depth for this clip (used for mask mixing).
	 * @returns {number|null}
	 */
	get bitDepth() {
		return this.#bitDepth;
	}

	/**
	 * Get the trigger type for this clip.
	 * @returns {string}
	 */
	get triggerType() {
		return this.#triggerType;
	}

	/**
	 * Get the trigger group for this clip.
	 * @returns {string|number|null}
	 */
	get triggerGroup() {
		return this.#triggerGroup;
	}

	/**
	 * Get the current playback mode.
	 * @returns {string}
	 */
	get playbackMode() {
		return this.#playback.playbackMode;
	}

	/**
	 * Get the current frame index (for tests / diagnostics).
	 * @returns {number}
	 */
	get currentFrame() {
		return this.#playback.frame;
	}

	/**
	 * Stop the clip and optionally reset to the first frame.
	 */
	stop() {
		if (this.#shouldRetrigger) {
			this.#resetState();
		}
		this.#timing.unsubscribeFromClock();
	}

	/**
	 * Reset clip to first frame if retrigger is enabled.
	 */
	reset() {
		if (!this.#shouldRetrigger && !this.#playback.isFinished) {
			return;
		}
		this.#resetState();
		this.#timing.subscribeToClock(progress => this.#advanceByProgress(progress));
	}

	#resetState() {
		this.#playback.reset();
		this.#timing.reset();
		this.#lastRenderTimestamp = null;
	}

	/**
	 * Manually set the scrub position (0.0 to 1.0).
	 * Only active when playbackMode is scrub.
	 * @param {number} normalizedValue
	 */
	setScrubPosition(normalizedValue) {
		this.#playback.setScrubPosition(normalizedValue);
	}

	/**
	 * Destroy clip and release image resources for garbage collection.
	 */
	destroy() {
		this.#timing.unsubscribeFromClock();
		this.#image = null;
	}
}

export default Clip;
