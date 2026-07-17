/**
 * Maintains Fisher-Yates shuffle state for playback.
 * Ensures all frames are visited before repeating.
 */
export class ShuffleState {
	#order = [];
	#position = 0;
	#frameCount = 0;

	/**
	 * @param {number} frameCount - Total number of frames
	 */
	constructor(frameCount) {
		this.#frameCount = frameCount;
		this.#reshuffle();
	}

	#reshuffle() {
		this.#order = Array.from({ length: this.#frameCount }, (_, i) => i);
		for (let i = this.#order.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[this.#order[i], this.#order[j]] = [this.#order[j], this.#order[i]];
		}
		this.#position = 0;
	}

	/**
	 * Get the next frame in the shuffle order.
	 * Reshuffles when all frames have been visited.
	 * @returns {number} Next frame index
	 */
	next() {
		if (this.#position >= this.#order.length) {
			this.#reshuffle();
		}
		return this.#order[this.#position++];
	}

	/**
	 * Reset the shuffle state (e.g. when playback restarts).
	 */
	reset() {
		this.#reshuffle();
	}
}

/**
 * Maintains pingpong direction state for playback.
 * Tracks bounce direction (+1/-1) to avoid freezing at endpoints.
 */
export class PingpongState {
	#direction = 1;

	/**
	 * Advance the frame index with bounce logic.
	 * @param {number} currentFrame - Current frame index (0-based)
	 * @param {number} frameCount - Total number of frames
	 * @returns {number} Next frame index
	 */
	next(currentFrame, frameCount) {
		let nextFrame = currentFrame + this.#direction;
		if (nextFrame >= frameCount - 1) {
			nextFrame = frameCount - 1;
			this.#direction = -1;
		} else if (nextFrame <= 0) {
			nextFrame = 0;
			this.#direction = 1;
		}
		return nextFrame;
	}

	/**
	 * Reset direction to forward.
	 */
	reset() {
		this.#direction = 1;
	}
}

/**
 * Advance a frame index based on the playback mode.
 * @param {number} currentFrame - Current frame index (0-based)
 * @param {number} frameCount - Total number of frames
 * @param {string} playbackMode - One of: once, loop, pingpong, reverse, random, shuffle, scrub
 * @param {ShuffleState} [shuffleState] - Required for shuffle mode
 * @param {PingpongState} [pingpongState] - Required for pingpong mode
 * @returns {{ frame: number, finished: boolean }} Next frame index and whether playback should stop
 */
export function advanceFrame(currentFrame, frameCount, playbackMode, shuffleState, pingpongState) {
	switch (playbackMode) {
		case 'reverse':
			return { frame: (currentFrame - 1 + frameCount) % frameCount, finished: false };
		case 'random':
			return { frame: Math.floor(Math.random() * frameCount), finished: false };
		case 'shuffle':
			if (!shuffleState) {
				return { frame: Math.floor(Math.random() * frameCount), finished: false };
			}
			return { frame: shuffleState.next(), finished: false };
		case 'once': {
			const nextFrame = currentFrame + 1;
			if (nextFrame >= frameCount) {
				return { frame: frameCount - 1, finished: true };
			}
			return { frame: nextFrame, finished: false };
		}
		case 'pingpong': {
			if (!pingpongState) {
				const nextFrame = currentFrame + 1;
				if (nextFrame >= frameCount - 1) {
					return { frame: frameCount - 1, finished: false };
				}
				return { frame: nextFrame, finished: false };
			}
			return { frame: pingpongState.next(currentFrame, frameCount), finished: false };
		}
		case 'loop':
		case 'scrub':
		default:
			return { frame: (currentFrame + 1) % frameCount, finished: false };
	}
}
