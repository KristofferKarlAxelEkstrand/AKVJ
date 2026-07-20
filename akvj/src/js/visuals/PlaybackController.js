/**
 * PlaybackController — frame advancement logic for all playback modes.
 *
 * Handles the seven playback modes: once, loop, pingpong, random, reverse,
 * shuffle, scrub. Maintains internal state for pingpong direction, shuffle
 * pool, and finished status.
 */
import { PLAYBACK_MODE } from './clipMetadata.js';

class PlaybackController {
	#frameCount;
	#playbackMode;
	#frame = 0;
	#isFinished = false;
	#pingpongDirection = 1;
	#lastShuffleFrame = -1;
	#unplayedShuffleFrames = [];

	/**
	 * @param {Object} options
	 * @param {number} options.frames - Total frame count
	 * @param {string} options.playback - Playback mode
	 */
	constructor({ frames, playback }) {
		this.#frameCount = frames;
		this.#playbackMode = playback;
		this.#resetState();
	}

	/**
	 * Current frame index.
	 * @returns {number}
	 */
	get frame() {
		return this.#frame;
	}

	/**
	 * Whether playback is finished (only for 'once' mode).
	 * @returns {boolean}
	 */
	get isFinished() {
		return this.#isFinished;
	}

	/**
	 * Current playback mode.
	 * @returns {string}
	 */
	get playbackMode() {
		return this.#playbackMode;
	}

	/**
	 * Set the scrub position (0.0 to 1.0). Only active in scrub mode.
	 * @param {number} normalizedValue
	 */
	setScrubPosition(normalizedValue) {
		if (this.#playbackMode !== PLAYBACK_MODE.SCRUB) {
			return;
		}
		const clamped = Math.max(0, Math.min(1, normalizedValue));
		this.#frame = Math.floor(clamped * (this.#frameCount - 1));
		this.#isFinished = false;
	}

	/**
	 * Map a clock-driven progress value (0.0-1.0 through the clip's total
	 * synced duration) to a displayed frame, per playback mode. Purely a
	 * progress → frame-index mapping — knows nothing about beats, pulses,
	 * or BPM (that's ClipTiming's job).
	 *
	 * Not applicable to 'random' or 'shuffle': sync does not apply to
	 * non-deterministic modes (spec "Resolved questions" #4). Callers must
	 * not invoke this method while in those modes.
	 * @param {number} progress - 0.0 to 1.0 through the clip's synced duration
	 * @throws {Error} If playback mode is 'random' or 'shuffle'
	 */
	setLinearProgress(progress) {
		if (this.#playbackMode === 'random' || this.#playbackMode === 'shuffle') {
			throw new Error(`setLinearProgress() does not apply to '${this.#playbackMode}' playback mode`);
		}

		const clamped = Math.max(0, Math.min(1, progress));
		this.#frame = this.#playbackMode === 'pingpong' ? this.#pingpongFrameFromProgress(clamped) : this.#linearFrameFromProgress(clamped);
		this.#isFinished = clamped >= 1 && this.#playbackMode !== 'loop';
	}

	/**
	 * Reset to initial state for the current playback mode.
	 */
	reset() {
		this.#resetState();
	}

	/**
	 * Advance frame index based on playback mode.
	 * @returns {boolean} True if clip continues playing, false if finished
	 */
	advance() {
		if (this.#playbackMode === PLAYBACK_MODE.SCRUB) {
			return true;
		}

		if (this.#playbackMode === 'random') {
			this.#frame = Math.floor(Math.random() * this.#frameCount);
			return true;
		}

		if (this.#playbackMode === 'shuffle') {
			this.#frame = this.#drawNextShuffleFrame();
			return true;
		}

		if (this.#playbackMode === 'reverse') {
			this.#frame--;
			if (this.#frame < 0) {
				this.#frame = this.#frameCount - 1;
			}
			return true;
		}

		if (this.#playbackMode === 'pingpong') {
			this.#frame += this.#pingpongDirection;
			if (this.#frame >= this.#frameCount - 1) {
				this.#frame = this.#frameCount - 1;
				this.#pingpongDirection = -1;
			} else if (this.#frame <= 0) {
				this.#frame = 0;
				this.#pingpongDirection = 1;
			}
			return true;
		}

		// 'loop' and 'once'
		this.#frame++;
		if (this.#frame < this.#frameCount) {
			return true;
		}

		if (this.#playbackMode === 'loop') {
			this.#frame %= this.#frameCount;
			return true;
		}

		// 'once'
		this.#frame = this.#frameCount - 1;
		this.#isFinished = true;
		return false;
	}

	#resetState() {
		this.#frame = this.#playbackMode === 'reverse' ? this.#frameCount - 1 : 0;
		this.#isFinished = false;
		this.#pingpongDirection = 1;
		this.#lastShuffleFrame = -1;
		this.#unplayedShuffleFrames = [];
	}

	/**
	 * Map progress to a frame index for loop/once/reverse modes.
	 * @param {number} progress - Clamped 0.0-1.0
	 * @returns {number} Frame index
	 */
	#linearFrameFromProgress(progress) {
		const linearIndex = Math.min(this.#frameCount - 1, Math.floor(progress * this.#frameCount));
		return this.#playbackMode === 'reverse' ? this.#frameCount - 1 - linearIndex : linearIndex;
	}

	/**
	 * Map progress to a frame index for pingpong mode, spanning the
	 * forward+backward traversal (0 → N-1 → 0, i.e. 2N-2 steps).
	 * @param {number} progress - Clamped 0.0-1.0
	 * @returns {number} Frame index
	 */
	#pingpongFrameFromProgress(progress) {
		if (this.#frameCount <= 1) {
			return 0;
		}
		const span = 2 * (this.#frameCount - 1);
		const position = progress * span;
		return position <= this.#frameCount - 1 ? Math.round(position) : Math.round(span - position);
	}

	/**
	 * Draw the next frame for true shuffle mode.
	 * Guarantees every frame is shown exactly once before any frame repeats.
	 * @returns {number} The next frame index
	 */
	#drawNextShuffleFrame() {
		if (this.#frameCount <= 1) {
			return 0;
		}
		if (this.#unplayedShuffleFrames.length === 0) {
			this.#unplayedShuffleFrames = this.#buildShuffledFramePool();
		}
		const nextFrame = this.#unplayedShuffleFrames.pop();
		this.#lastShuffleFrame = nextFrame;
		return nextFrame;
	}

	/**
	 * Build a freshly shuffled pool of all frame indices, ensuring the first
	 * frame of the new pool never matches the last frame played.
	 * @returns {number[]} Shuffled frame indices
	 */
	#buildShuffledFramePool() {
		const pool = Array.from({ length: this.#frameCount }, (_, index) => index);
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		if (pool[pool.length - 1] === this.#lastShuffleFrame && pool.length > 1) {
			const swapIndex = Math.floor(Math.random() * (pool.length - 1));
			[pool[pool.length - 1], pool[swapIndex]] = [pool[swapIndex], pool[pool.length - 1]];
		}
		return pool;
	}
}

export default PlaybackController;
