import '../scss/ClipFrame.scss';
import { FRAME_BAKE_SCALE_MODES, resolveFrameBakeConfig } from './frameBake.js';

/**
 * ClipFrame — individual frame element with image, duration, and bake-config controls.
 *
 * @fires ClipFrame#durationchange - CustomEvent with `{ detail: { frameIndex, durationMs } }`
 * @fires ClipFrame#bakeconfigchange - CustomEvent with `{ detail: { frameIndex, bakeConfig } }`
 */
class ClipFrame extends HTMLElement {
	#frameIndex = 0;
	#imageSrc = '';
	#durationMs = 1000;
	#bakeConfig = resolveFrameBakeConfig({});
	#imgElement = null;
	#durationInput = null;
	#scaleSelect = null;
	#customWidthInput = null;
	#customHeightInput = null;
	#placementXInput = null;
	#placementYInput = null;
	#customFields = null;

	/**
	 * @param {number} index
	 * @param {string} src
	 * @param {number} durationMs
	 * @param {object} [bakeConfig]
	 */
	setFrame(index, src, durationMs, bakeConfig) {
		this.#frameIndex = index;
		this.#imageSrc = src;
		this.#durationMs = durationMs;
		this.#bakeConfig = resolveFrameBakeConfig(bakeConfig);
		this.#render();
	}

	get frameIndex() {
		return this.#frameIndex;
	}

	get durationMs() {
		return this.#durationMs;
	}

	get bakeConfig() {
		return { ...this.#bakeConfig, placement: { ...this.#bakeConfig.placement } };
	}

	/**
	 * @param {number} durationMs
	 */
	setDurationMs(durationMs) {
		const ms = Math.max(1, Math.round(Number(durationMs)) || 1);
		this.#durationMs = ms;
		if (this.#durationInput) {
			this.#durationInput.value = String(ms);
		}
	}

	/**
	 * @param {object} bakeConfig
	 */
	setBakeConfig(bakeConfig) {
		this.#bakeConfig = resolveFrameBakeConfig(bakeConfig);
		this.#syncBakeConfigControls();
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
	}

	#render() {
		this.replaceChildren();

		this.#imgElement = document.createElement('img');
		this.#imgElement.src = this.#imageSrc;
		this.#imgElement.alt = `Frame ${this.#frameIndex + 1}`;
		this.#imgElement.className = 'clip-frame-img';
		this.#imgElement.draggable = false;

		const label = document.createElement('span');
		label.className = 'clip-frame-index';
		label.textContent = String(this.#frameIndex + 1);

		this.#durationInput = document.createElement('input');
		this.#durationInput.type = 'number';
		this.#durationInput.min = '1';
		this.#durationInput.step = '1';
		this.#durationInput.value = String(this.#durationMs);
		this.#durationInput.className = 'clip-frame-duration';
		this.#durationInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} duration (ms)`);
		this.#durationInput.addEventListener('change', () => {
			this.#durationMs = Number(this.#durationInput.value) || 1;
			this.dispatchEvent(
				new CustomEvent('durationchange', {
					bubbles: true,
					detail: { frameIndex: this.#frameIndex, durationMs: this.#durationMs }
				})
			);
		});

		this.#scaleSelect = document.createElement('select');
		this.#scaleSelect.className = 'clip-frame-scale';
		this.#scaleSelect.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} bake scale`);
		for (const mode of FRAME_BAKE_SCALE_MODES) {
			const option = document.createElement('option');
			option.value = mode;
			option.textContent = mode;
			this.#scaleSelect.append(option);
		}
		this.#scaleSelect.addEventListener('change', () => this.#emitBakeConfigChange());

		this.#customFields = document.createElement('div');
		this.#customFields.className = 'clip-frame-custom-size';
		this.#customWidthInput = document.createElement('input');
		this.#customWidthInput.type = 'number';
		this.#customWidthInput.min = '1';
		this.#customWidthInput.step = '1';
		this.#customWidthInput.className = 'clip-frame-custom-width';
		this.#customWidthInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} custom width`);
		this.#customWidthInput.addEventListener('change', () => this.#emitBakeConfigChange());
		this.#customHeightInput = document.createElement('input');
		this.#customHeightInput.type = 'number';
		this.#customHeightInput.min = '1';
		this.#customHeightInput.step = '1';
		this.#customHeightInput.className = 'clip-frame-custom-height';
		this.#customHeightInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} custom height`);
		this.#customHeightInput.addEventListener('change', () => this.#emitBakeConfigChange());
		this.#customFields.append(this.#customWidthInput, this.#customHeightInput);

		this.#placementXInput = document.createElement('input');
		this.#placementXInput.type = 'number';
		this.#placementXInput.step = '1';
		this.#placementXInput.className = 'clip-frame-placement-x';
		this.#placementXInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} placement X`);
		this.#placementXInput.title = 'Bake placement X (0 = center)';
		this.#placementXInput.addEventListener('change', () => this.#emitBakeConfigChange());
		this.#placementXInput.addEventListener('input', () => this.#emitBakeConfigChange());

		this.#placementYInput = document.createElement('input');
		this.#placementYInput.type = 'number';
		this.#placementYInput.step = '1';
		this.#placementYInput.className = 'clip-frame-placement-y';
		this.#placementYInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} placement Y`);
		this.#placementYInput.title = 'Bake placement Y (0 = center)';
		this.#placementYInput.addEventListener('change', () => this.#emitBakeConfigChange());
		this.#placementYInput.addEventListener('input', () => this.#emitBakeConfigChange());

		const removeButton = document.createElement('button');
		removeButton.type = 'button';
		removeButton.className = 'clip-frame-remove';
		removeButton.textContent = 'Remove';
		removeButton.setAttribute('aria-label', `Remove frame ${this.#frameIndex + 1}`);
		removeButton.addEventListener('click', event => {
			event.stopPropagation();
			this.dispatchEvent(
				new CustomEvent('frameremove', {
					bubbles: true,
					detail: { frameIndex: this.#frameIndex }
				})
			);
		});

		this.append(this.#imgElement, label, this.#durationInput, this.#scaleSelect, this.#customFields, this.#placementXInput, this.#placementYInput, removeButton);
		this.#syncBakeConfigControls();
	}

	#syncBakeConfigControls() {
		if (!this.#scaleSelect) {
			return;
		}
		this.#scaleSelect.value = this.#bakeConfig.scaleMode;
		this.#customWidthInput.value = String(this.#bakeConfig.width);
		this.#customHeightInput.value = String(this.#bakeConfig.height);
		this.#placementXInput.value = String(this.#bakeConfig.placement.x);
		this.#placementYInput.value = String(this.#bakeConfig.placement.y);
		this.#customFields.hidden = this.#bakeConfig.scaleMode !== 'custom';
	}

	#readBakeConfigFromDom() {
		return resolveFrameBakeConfig({
			scaleMode: this.#scaleSelect.value,
			width: Number(this.#customWidthInput.value),
			height: Number(this.#customHeightInput.value),
			placement: {
				x: Number(this.#placementXInput.value),
				y: Number(this.#placementYInput.value)
			}
		});
	}

	#emitBakeConfigChange() {
		this.#bakeConfig = this.#readBakeConfigFromDom();
		this.#customFields.hidden = this.#bakeConfig.scaleMode !== 'custom';
		this.dispatchEvent(
			new CustomEvent('bakeconfigchange', {
				bubbles: true,
				detail: { frameIndex: this.#frameIndex, bakeConfig: this.bakeConfig }
			})
		);
	}
}

customElements.define('clip-frame', ClipFrame);

export { ClipFrame };
