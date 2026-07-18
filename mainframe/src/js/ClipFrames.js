import '../scss/ClipFrames.scss';
import { ClipFrame } from './ClipFrame.js';

/**
 * ClipFrames — horizontally scrollable container of ClipFrame elements.
 *
 * Supports drag-and-drop reordering, per-frame remove, and clear-all.
 *
 * @fires ClipFrames#framesreordered - CustomEvent with `{ detail: { indices: number[] } }`
 * @fires ClipFrames#frameremove - CustomEvent with `{ detail: { frameIndex } }` (after removal)
 * @fires ClipFrames#framescleared - CustomEvent when all frames cleared
 * @fires ClipFrames#durationchange - Relayed from ClipFrame
 */
class ClipFrames extends HTMLElement {
	#frameData = [];
	#draggedIndex = null;

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	/**
	 * Load frames from an array of image source URLs.
	 * @param {Array<{src: string, duration: number}>} frames - Frame data
	 */
	loadFrames(frames) {
		this.#frameData = (frames || []).map((frame, index) => ({
			src: frame.src,
			duration: frame.duration ?? 1000,
			originalIndex: index
		}));
		this.#render();
	}

	/**
	 * Get the current frame order as an array of original indices.
	 * @returns {number[]}
	 */
	getFrameOrder() {
		return this.#frameData.map(frame => frame.originalIndex);
	}

	/**
	 * Get durations in current order.
	 * @returns {number[]}
	 */
	getDurations() {
		return this.#frameData.map(frame => frame.duration);
	}

	/**
	 * Whether every frame shares the same duration (empty list counts as uniform).
	 * @returns {boolean}
	 */
	areDurationsUniform() {
		const durations = this.getDurations();
		if (durations.length === 0) {
			return true;
		}
		const first = durations[0];
		return durations.every(duration => duration === first);
	}

	/**
	 * Set every frame's duration to the same millisecond value.
	 * @param {number} ms
	 * @returns {number} Applied duration in ms
	 */
	setAllDurations(ms) {
		const duration = Math.max(1, Math.round(Number(ms)) || 1);
		for (const frame of this.#frameData) {
			frame.duration = duration;
		}
		for (const child of this.querySelectorAll('clip-frame')) {
			child.setDuration(duration);
		}
		this.dispatchEvent(
			new CustomEvent('durationchange', {
				bubbles: true,
				detail: { all: true, duration }
			})
		);
		return duration;
	}

	/**
	 * @returns {number}
	 */
	get frameCount() {
		return this.#frameData.length;
	}

	/**
	 * Remove a frame by current visual index.
	 * @param {number} index
	 */
	removeFrameAt(index) {
		if (index < 0 || index >= this.#frameData.length) {
			return;
		}
		this.#frameData.splice(index, 1);
		this.#render();
		this.dispatchEvent(
			new CustomEvent('frameremove', {
				bubbles: true,
				detail: { frameIndex: index }
			})
		);
	}

	/**
	 * Clear all frames.
	 */
	clearAll() {
		if (this.#frameData.length === 0) {
			return;
		}
		this.#frameData = [];
		this.#render();
		this.dispatchEvent(new CustomEvent('framescleared', { bubbles: true }));
	}

	#render() {
		this.replaceChildren();

		for (let i = 0; i < this.#frameData.length; i++) {
			const frame = this.#frameData[i];
			const clipFrame = new ClipFrame();
			clipFrame.setFrame(i, frame.src, frame.duration);
			clipFrame.dataset.position = String(i);
			clipFrame.draggable = true;

			clipFrame.addEventListener('dragstart', event => {
				this.#draggedIndex = i;
				event.dataTransfer.effectAllowed = 'move';
			});

			clipFrame.addEventListener('dragover', event => {
				event.preventDefault();
				event.dataTransfer.dropEffect = 'move';
			});

			clipFrame.addEventListener('drop', event => {
				event.preventDefault();
				if (this.#draggedIndex !== null && this.#draggedIndex !== i) {
					this.#reorderFrames(this.#draggedIndex, i);
				}
				this.#draggedIndex = null;
			});

			clipFrame.addEventListener('dragend', () => {
				this.#draggedIndex = null;
			});

			clipFrame.addEventListener('durationchange', event => {
				this.#frameData[i].duration = event.detail.duration;
			});

			clipFrame.addEventListener('frameremove', event => {
				event.stopPropagation();
				this.removeFrameAt(i);
			});

			this.append(clipFrame);
		}
	}

	#reorderFrames(fromIndex, toIndex) {
		const [moved] = this.#frameData.splice(fromIndex, 1);
		this.#frameData.splice(toIndex, 0, moved);
		this.#render();
		this.dispatchEvent(
			new CustomEvent('framesreordered', {
				bubbles: true,
				detail: { indices: this.getFrameOrder() }
			})
		);
	}
}

customElements.define('clip-frames', ClipFrames);

export { ClipFrames };
