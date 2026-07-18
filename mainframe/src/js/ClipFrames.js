import '../scss/ClipFrames.scss';
import { ClipFrame } from './ClipFrame.js';
import { resolveFrameBakeConfig, areFrameBakeConfigsUniform } from './frameBake.js';

/**
 * ClipFrames — horizontally scrollable container of ClipFrame elements.
 *
 * @fires ClipFrames#framesreordered
 * @fires ClipFrames#frameremove
 * @fires ClipFrames#framescleared
 * @fires ClipFrames#durationchange
 * @fires ClipFrames#bakeconfigchange
 */
class ClipFrames extends HTMLElement {
	#frameEntries = [];
	#draggedIndex = null;

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	/**
	 * @param {Array<{src: string, durationMs?: number, bakeConfig?: object}>} frames
	 */
	loadFrames(frames) {
		this.#frameEntries = (frames || []).map((frame, index) => ({
			src: frame.src,
			durationMs: frame.durationMs ?? 1000,
			bakeConfig: resolveFrameBakeConfig(frame.bakeConfig),
			originalIndex: index
		}));
		this.#render();
	}

	getFrameOrder() {
		return this.#frameEntries.map(frame => frame.originalIndex);
	}

	getDurationsMs() {
		return this.#frameEntries.map(frame => frame.durationMs);
	}

	/**
	 * @returns {ReturnType<typeof resolveFrameBakeConfig>[]}
	 */
	getBakeConfigs() {
		return this.#frameEntries.map(frame => ({
			...frame.bakeConfig,
			placement: { ...frame.bakeConfig.placement }
		}));
	}

	areDurationsMsUniform() {
		const durationsMs = this.getDurationsMs();
		if (durationsMs.length === 0) {
			return true;
		}
		const first = durationsMs[0];
		return durationsMs.every(durationMs => durationMs === first);
	}

	areBakeConfigsUniform() {
		return areFrameBakeConfigsUniform(this.getBakeConfigs());
	}

	/**
	 * @param {number} ms
	 * @returns {number}
	 */
	setAllDurationsMs(ms) {
		const durationMs = Math.max(1, Math.round(Number(ms)) || 1);
		for (const frame of this.#frameEntries) {
			frame.durationMs = durationMs;
		}
		for (const child of this.querySelectorAll('clip-frame')) {
			child.setDurationMs(durationMs);
		}
		this.dispatchEvent(
			new CustomEvent('durationchange', {
				bubbles: true,
				detail: { all: true, durationMs }
			})
		);
		return durationMs;
	}

	/**
	 * @param {object} bakeConfig
	 * @returns {ReturnType<typeof resolveFrameBakeConfig>}
	 */
	setAllBakeConfigs(bakeConfig) {
		const resolved = resolveFrameBakeConfig(bakeConfig);
		for (const frame of this.#frameEntries) {
			frame.bakeConfig = { ...resolved, placement: { ...resolved.placement } };
		}
		for (const child of this.querySelectorAll('clip-frame')) {
			child.setBakeConfig(resolved);
		}
		this.dispatchEvent(
			new CustomEvent('bakeconfigchange', {
				bubbles: true,
				detail: { all: true, bakeConfig: resolved }
			})
		);
		return resolved;
	}

	get frameCount() {
		return this.#frameEntries.length;
	}

	removeFrameAt(index) {
		if (index < 0 || index >= this.#frameEntries.length) {
			return;
		}
		this.#frameEntries.splice(index, 1);
		this.#render();
		this.dispatchEvent(
			new CustomEvent('frameremove', {
				bubbles: true,
				detail: { frameIndex: index }
			})
		);
	}

	clearAll() {
		if (this.#frameEntries.length === 0) {
			return;
		}
		this.#frameEntries = [];
		this.#render();
		this.dispatchEvent(new CustomEvent('framescleared', { bubbles: true }));
	}

	#render() {
		this.replaceChildren();

		for (let i = 0; i < this.#frameEntries.length; i++) {
			const frame = this.#frameEntries[i];
			const clipFrame = new ClipFrame();
			clipFrame.setFrame(i, frame.src, frame.durationMs, frame.bakeConfig);
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
				this.#frameEntries[i].durationMs = event.detail.durationMs;
			});

			clipFrame.addEventListener('bakeconfigchange', event => {
				this.#frameEntries[i].bakeConfig = resolveFrameBakeConfig(event.detail.bakeConfig);
			});

			clipFrame.addEventListener('frameremove', event => {
				event.stopPropagation();
				this.removeFrameAt(i);
			});

			this.append(clipFrame);
		}
	}

	#reorderFrames(fromIndex, toIndex) {
		const [moved] = this.#frameEntries.splice(fromIndex, 1);
		this.#frameEntries.splice(toIndex, 0, moved);
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
