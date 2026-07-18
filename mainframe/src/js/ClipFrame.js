import '../scss/ClipFrame.scss';

/**
 * ClipFrame — individual frame element with image and duration input.
 *
 * @fires ClipFrame#durationchange - CustomEvent with `{ detail: { frameIndex, duration } }`
 */
class ClipFrame extends HTMLElement {
	#frameIndex = 0;
	#imageSrc = '';
	#duration = 1000;
	#imgElement = null;
	#durationInput = null;

	/**
	 * @param {number} index - Frame index within the sequence
	 * @param {string} src - Image source URL (object URL or data URL)
	 * @param {number} duration - Frame duration in milliseconds
	 */
	setFrame(index, src, duration) {
		this.#frameIndex = index;
		this.#imageSrc = src;
		this.#duration = duration;
		this.#render();
	}

	get frameIndex() {
		return this.#frameIndex;
	}

	get duration() {
		return this.#duration;
	}

	/**
	 * Update duration without a full re-render (used by set-all).
	 * @param {number} duration - Milliseconds
	 */
	setDuration(duration) {
		const ms = Math.max(1, Math.round(Number(duration)) || 1);
		this.#duration = ms;
		if (this.#durationInput) {
			this.#durationInput.value = String(ms);
		}
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
		this.#durationInput.value = String(this.#duration);
		this.#durationInput.className = 'clip-frame-duration';
		this.#durationInput.setAttribute('aria-label', `Frame ${this.#frameIndex + 1} duration (ms)`);

		this.#durationInput.addEventListener('change', () => {
			this.#duration = Number(this.#durationInput.value) || 1;
			this.dispatchEvent(new CustomEvent('durationchange', {
				bubbles: true,
				detail: { frameIndex: this.#frameIndex, duration: this.#duration }
			}));
		});

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

		this.append(this.#imgElement, label, this.#durationInput, removeButton);
	}
}

customElements.define('clip-frame', ClipFrame);

export { ClipFrame };
