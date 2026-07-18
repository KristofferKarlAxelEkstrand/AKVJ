/**
 * PlaybackController — frame advancement logic for all playback modes.
 *
 * Handles the seven playback modes: once, loop, pingpong, random, reverse,
 * shuffle, scrub. Maintains internal state for pingpong direction, shuffle
 * pool, and finished status.
 */

class PlaybackController {
	#numberOfFrames;
	#playbackMode;
	#frame = 0;
	#isFinished = false;
	#pingpongDirection = 1;
	#lastRandomFrame = -1;
	#unplayedShuffleFrames = [];

	/**
	 * @param {Object} options
	 * @param {number} options.frames - Total frame count
	 * @param {string} options.playback - Playback mode
	 */
	constructor({ frames, playback }) {
		this.#numberOfFrames = frames;
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
	 * Set the scrub position (0.0 to 1.0). Only active in 'scrub' mode.
	 * @param {number} normalizedValue
	 */
	setScrubPosition(normalizedValue) {
		if (this.#playbackMode !== 'scrub') {
			return;
		}
		const clamped = Math.max(0, Math.min(1, normalizedValue));
		this.#frame = Math.floor(clamped * (this.#numberOfFrames - 1));
		this.#isFinished = false;
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
		if (this.#playbackMode === 'scrub') {
			return true;
		}

		if (this.#playbackMode === 'random') {
			this.#frame = Math.floor(Math.random() * this.#numberOfFrames);
			return true;
		}

		if (this.#playbackMode === 'shuffle') {
			this.#frame = this.#drawNextShuffleFrame();
			return true;
		}

		if (this.#playbackMode === 'reverse') {
			this.#frame--;
			if (this.#frame < 0) {
				this.#frame = this.#numberOfFrames - 1;
			}
			return true;
		}

		if (this.#playbackMode === 'pingpong') {
			this.#frame += this.#pingpongDirection;
			if (this.#frame >= this.#numberOfFrames - 1) {
				this.#frame = this.#numberOfFrames - 1;
				this.#pingpongDirection = -1;
			} else if (this.#frame <= 0) {
				this.#frame = 0;
				this.#pingpongDirection = 1;
			}
			return true;
		}

		// 'loop' and 'once'
		this.#frame++;
		if (this.#frame < this.#numberOfFrames) {
			return true;
		}

		if (this.#playbackMode === 'loop') {
			this.#frame %= this.#numberOfFrames;
			return true;
		}

		// 'once'
		this.#frame = this.#numberOfFrames - 1;
		this.#isFinished = true;
		return false;
	}

	/**
	 * Mark as finished and stop playback.
	 */
	finish() {
		this.#isFinished = true;
	}

	/**
	 * Clear finished state.
	 */
	clearFinished() {
		this.#isFinished = false;
	}

	#resetState() {
		this.#frame = this.#playbackMode === 'reverse' ? this.#numberOfFrames - 1 : 0;
		this.#isFinished = false;
		this.#pingpongDirection = 1;
		this.#lastRandomFrame = -1;
		this.#unplayedShuffleFrames = [];
	}

	/**
	 * Draw the next frame for true shuffle mode.
	 * Guarantees every frame is shown exactly once before any frame repeats.
	 * @returns {number} The next frame index
	 */
	#drawNextShuffleFrame() {
		if (this.#numberOfFrames <= 1) {
			return 0;
		}
		if (this.#unplayedShuffleFrames.length === 0) {
			this.#unplayedShuffleFrames = this.#buildShuffledFramePool();
		}
		const nextFrame = this.#unplayedShuffleFrames.pop();
		this.#lastRandomFrame = nextFrame;
		return nextFrame;
	}

	/**
	 * Build a freshly shuffled pool of all frame indices, ensuring the first
	 * frame of the new pool never matches the last frame played.
	 * @returns {number[]} Shuffled frame indices
	 */
	#buildShuffledFramePool() {
		const pool = Array.from({ length: this.#numberOfFrames }, (_, index) => index);
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[pool[i], pool[j]] = [pool[j], pool[i]];
		}
		if (pool[pool.length - 1] === this.#lastRandomFrame && pool.length > 1) {
			const swapIndex = Math.floor(Math.random() * (pool.length - 1));
			[pool[pool.length - 1], pool[swapIndex]] = [pool[swapIndex], pool[pool.length - 1]];
		}
		return pool;
	}
}

export default PlaybackController;
