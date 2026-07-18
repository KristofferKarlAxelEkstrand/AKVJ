import '../scss/PianoKey.scss';

const PIANO_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const PIANO_BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];

/**
 * @param {number} note - MIDI note number (0–127)
 * @returns {boolean}
 */
function isBlackKey(note) {
	return PIANO_BLACK_KEY_OFFSETS.includes(note % 12);
}

/**
 * @param {number} note
 * @returns {string}
 */
function noteLabel(note) {
	return `${PIANO_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
}

/**
 * Hue derived from chromatic note class for consistent per-key coloring.
 * @param {number} note
 * @returns {number} hue degrees 0–360
 */
function noteHue(note) {
	return (note % 12) * 30;
}

/**
 * Build velocity bands from sorted mapping entries for one note.
 * Each band spans from its velocity to the next band's velocity (or 128).
 *
 * @param {Array<{velocity: number, clipId: string}>} entries
 * @returns {Array<{velocity: number, clipId: string, start: number, end: number}>}
 */
function buildVelocityBands(entries) {
	const sorted = [...entries].sort((a, b) => a.velocity - b.velocity);
	return sorted.map((entry, index) => {
		const start = entry.velocity;
		const end = index + 1 < sorted.length ? sorted[index + 1].velocity : 128;
		return {
			velocity: entry.velocity,
			clipId: entry.clipId,
			start,
			end: Math.max(end, start + 1)
		};
	});
}

/**
 * PianoKey — individual piano key with mapped/active states and optional velocity bands.
 *
 * @fires PianoKey#keyclickrequest - CustomEvent with `{ detail: { note, velocity?, clipId?, action } }` (bubbles)
 */
class PianoKey extends HTMLElement {
	#note = 0;
	#mapped = false;
	#active = false;
	#dimmed = false;
	#clipId = null;
	/** @type {Array<{velocity: number, clipId: string, start: number, end: number}>} */
	#velocityBands = [];
	#bandsContainer = null;
	#boundPointerUp = null;

	/**
	 * @param {number} note
	 */
	set note(note) {
		this.#note = note;
		this.dataset.note = String(note);
		this.classList.toggle('is-black', isBlackKey(note));
		this.classList.toggle('is-white', !isBlackKey(note));
		this.style.setProperty('--key-hue', String(noteHue(note)));
		this.#renderLabel();
		this.#updateTitle();
		this.#renderBands();
	}

	get note() {
		return this.#note;
	}

	/**
	 * @param {boolean} mapped
	 */
	set mapped(mapped) {
		this.#mapped = mapped;
		this.classList.toggle('is-mapped', mapped);
		this.#updateTitle();
	}

	get mapped() {
		return this.#mapped;
	}

	/**
	 * @param {boolean} active
	 */
	set active(active) {
		this.#active = active;
		this.classList.toggle('is-active', active);
	}

	get active() {
		return this.#active;
	}

	/**
	 * @param {boolean} dimmed
	 */
	set dimmed(dimmed) {
		this.#dimmed = dimmed;
		this.classList.toggle('is-dimmed', dimmed);
	}

	get dimmed() {
		return this.#dimmed;
	}

	/**
	 * @param {string|null} clipId
	 */
	set clipId(clipId) {
		this.#clipId = clipId;
		this.#updateTitle();
	}

	get clipId() {
		return this.#clipId;
	}

	/**
	 * @param {Array<{velocity: number, clipId: string, start: number, end: number}>} bands
	 */
	set velocityBands(bands) {
		this.#velocityBands = bands;
		this.classList.toggle('has-bands', bands.length > 0);
		this.#renderBands();
		this.#updateTitle();
	}

	get velocityBands() {
		return this.#velocityBands;
	}

	connectedCallback() {
		this.setAttribute('role', 'button');
		this.tabIndex = 0;
		this.style.touchAction = 'manipulation';
		this.#boundPointerUp = event => {
			if (event.pointerType === 'mouse' && event.button !== 0) {
				return;
			}
			if (event.target.closest('.velocity-band')) {
				return;
			}
			this.dispatchEvent(new CustomEvent('keyclickrequest', {
				bubbles: true,
				detail: { note: this.#note, velocity: null, clipId: null, action: 'assign' }
			}));
		};
		this.addEventListener('pointerup', this.#boundPointerUp);
		this.addEventListener('keydown', event => {
			if (event.key === 'Enter' || event.key === ' ') {
				event.preventDefault();
				this.dispatchEvent(new CustomEvent('keyclickrequest', {
					bubbles: true,
					detail: { note: this.#note, velocity: null, clipId: null, action: 'assign' }
				}));
			}
		});
	}

	disconnectedCallback() {
		if (this.#boundPointerUp) {
			this.removeEventListener('pointerup', this.#boundPointerUp);
		}
		this.replaceChildren();
		this.#bandsContainer = null;
	}

	#renderLabel() {
		const existing = this.querySelector('.piano-key-label');
		if (this.#note % 12 !== 0) {
			existing?.remove();
			return;
		}
		const label = existing ?? document.createElement('span');
		label.className = 'piano-key-label';
		label.textContent = noteLabel(this.#note);
		if (!existing) {
			this.append(label);
		}
	}

	#renderBands() {
		if (this.#velocityBands.length === 0) {
			this.#bandsContainer?.remove();
			this.#bandsContainer = null;
			return;
		}

		if (!this.#bandsContainer) {
			this.#bandsContainer = document.createElement('div');
			this.#bandsContainer.className = 'velocity-bands';
			this.prepend(this.#bandsContainer);
		}

		this.#bandsContainer.replaceChildren();
		for (const band of this.#velocityBands) {
			const bandElement = document.createElement('button');
			bandElement.type = 'button';
			bandElement.className = 'velocity-band';
			bandElement.dataset.velocity = String(band.velocity);
			bandElement.dataset.clipId = band.clipId;
			bandElement.title = `${band.clipId} (vel ${band.start}–${band.end - 1})`;
			bandElement.style.bottom = `${(band.start / 128) * 100}%`;
			bandElement.style.height = `${((band.end - band.start) / 128) * 100}%`;
			bandElement.textContent = band.clipId;
			bandElement.addEventListener('pointerup', event => {
				event.stopPropagation();
				if (event.pointerType === 'mouse' && event.button !== 0) {
					return;
				}
				this.dispatchEvent(new CustomEvent('keyclickrequest', {
					bubbles: true,
					detail: {
						note: this.#note,
						velocity: band.velocity,
						clipId: band.clipId,
						action: 'select'
					}
				}));
			});
			this.#bandsContainer.append(bandElement);
		}
	}

	#updateTitle() {
		const base = `${noteLabel(this.#note)} (MIDI ${this.#note})`;
		if (this.#velocityBands.length > 0) {
			const summary = this.#velocityBands.map(band => `${band.clipId}@${band.velocity}`).join(', ');
			this.title = `${base} → ${summary}`;
			return;
		}
		this.title = this.#clipId ? `${base} → ${this.#clipId}` : base;
	}
}

customElements.define('piano-key', PianoKey);

export { PianoKey, isBlackKey, noteLabel, noteHue, buildVelocityBands };
