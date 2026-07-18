/**
 * Clip - Thin render facade for individual sprite clip playback and rendering.
 *
 * Delegates timing to ClipTiming and frame advancement to PlaybackController.
 * Manages image dimensions, canvas drawing, and clip lifecycle (reset/stop/destroy).
 */
import settings from '../core/settings.js';
import ClipTiming from './ClipTiming.js';
import PlaybackController from './PlaybackController.js';
import { MAX_PATTERN_TILES_PER_FRAME, drawPattern, drawScaled, drawStretch } from './clipDrawRect.js';

export { MAX_PATTERN_TILES_PER_FRAME };

class Clip {
	// Configuration (immutable after construction)
	#image;
	#numberOfFrames;
	#framesPerRow;
	#frameWidth;
	#frameHeight;
	#shouldRetrigger;
	#bitDepth;
	#canvasWidth;
	#canvasHeight;
	#scaleMode;
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
	 * @param {CanvasRenderingContext2D} options.displayContext - Unused (kept for API compat)
	 * @param {HTMLImageElement} options.image
	 * @param {number} options.frames
	 * @param {number} options.framesPerRow
	 * @param {string} [options.playback='loop']
	 * @param {Object} [options.frameRatesForFrames={ 0: 1 }]
	 * @param {number|number[]|null} [options.frameDurationBeats=null]
	 * @param {boolean} [options.retrigger=true]
	 * @param {number|null} [options.bitDepth=null]
	 * @param {string} [options.triggerType='momentary']
	 * @param {string|number|null} [options.triggerGroup=null]
	 * @param {string} [options.scaleMode='fit']
	 * @param {{ x: number, y: number }} [options.placement={ x: 0, y: 0 }]
	 * @param {() => number} [options.bpmProvider] - Injected BPM provider for testability
	 * @param {{ bpmSource: string, subscribe: Function }} [options.clockSource] - Injected clock source for testability
	 */
	constructor({ displayContext: _displayContext, image, frames, framesPerRow, playback = 'loop', frameRatesForFrames = { 0: 1 }, frameDurationBeats = null, retrigger = true, bitDepth = null, triggerType = 'momentary', triggerGroup = null, scaleMode = 'fit', placement = { x: 0, y: 0 }, bpmProvider, clockSource }) {
		this.#validateConstructorParams(frames, framesPerRow);
		this.#initCoreFields(image, frames, framesPerRow, bitDepth);
		this.#initDimensions(image, frames, framesPerRow);
		this.#shouldRetrigger = retrigger;
		this.#triggerType = triggerType;
		this.#triggerGroup = triggerGroup;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;
		this.#scaleMode = scaleMode;
		this.#placement = placement;

		this.#timing = new ClipTiming({ frameRatesForFrames, frameDurationBeats, frames, bpmProvider, clockSource });
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
		this.#numberOfFrames = frames;
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
		const continues = this.#advancePlayback();
		this.#timing.setCurrentFrameIndex(this.#playback.frame);
		return continues;
	}

	/**
	 * Advance playback and handle clock unsubscribe on finish.
	 * @returns {boolean}
	 */
	#advancePlayback() {
		const continues = this.#playback.advance();
		if (!continues) {
			this.#timing.unsubscribeFromClock();
		}
		return continues;
	}

	/**
	 * Draw the current frame to a canvas context using scaleMode + placement.
	 * @param {CanvasRenderingContext2D} ctx
	 */
	#drawToContext(ctx) {
		if (!this.#image || !ctx || this.#playback.isFinished) {
			return;
		}

		const drawFrame = Math.min(this.#playback.frame, this.#numberOfFrames - 1);
		const frameRow = Math.floor(drawFrame / this.#framesPerRow);
		const frameColumn = drawFrame - frameRow * this.#framesPerRow;
		const sourceX = this.#frameWidth * frameColumn;
		const sourceY = this.#frameHeight * frameRow;

		if (this.#scaleMode === 'pattern') {
			drawPattern(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight, this.#placement);
		} else if (this.#scaleMode === 'stretch') {
			drawStretch(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight);
		} else {
			drawScaled(ctx, this.#image, sourceX, sourceY, this.#frameWidth, this.#frameHeight, this.#canvasWidth, this.#canvasHeight, this.#scaleMode, this.#placement);
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
	 * Get the trigger group (choke group) for this clip.
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
		this.#timing.subscribeToClock(() => this.#advanceNextFrame());
	}

	#resetState() {
		this.#playback.reset();
		this.#timing.reset();
		this.#lastRenderTimestamp = null;
	}

	/**
	 * Manually set the scrub position (0.0 to 1.0).
	 * Only active when playbackMode is 'scrub'.
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
