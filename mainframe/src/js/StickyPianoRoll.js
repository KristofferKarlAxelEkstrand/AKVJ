const PIANO_BLACK_KEY_OFFSETS = [1, 3, 6, 8, 10];
const PIANO_NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Checks whether a MIDI note corresponds to a black piano key.
 * @param {number} note - MIDI note number (0–127)
 * @returns {boolean}
 */
function isBlackKey(note) {
	return PIANO_BLACK_KEY_OFFSETS.includes(note % 12);
}

/**
 * AkvjStickyPianoRoll — compact, sticky piano roll component for the library panel.
 *
 * Shows a condensed 128-key piano that stays fixed at the top of the clip list
 * during scrolling. Highlights mapped notes for the current channel and dispatches
 * `stickykeyclick` events when keys are clicked, allowing clip filtering by note.
 *
 * Follows the PianoKeyboard component pattern (Custom Elements, lifecycle, private fields).
 *
 * @fires AkvjStickyPianoRoll#stickykeyclick - CustomEvent with `{ detail: { note, clipId } }`
 */
class AkvjStickyPianoRoll extends HTMLElement {
	/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
	#mappings = [];
	#channel = 1;
	#activeFilterNote = null;
	#hasRenderedKeys = false;

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} mappings
	 */
	set mappings(mappings) {
		this.#mappings = mappings;
		if (this.#hasRenderedKeys) {
			this.#updateMappedKeys();
		} else {
			this.#render();
		}
	}

	/**
	 * @returns {Array<{channel: number, note: number, velocity: number, clipId: string}>}
	 */
	get mappings() {
		return this.#mappings;
	}

	/**
	 * @param {number} channel - DAW channel number (1–16)
	 */
	set channel(channel) {
		this.#channel = channel;
		if (this.#hasRenderedKeys) {
			this.#updateMappedKeys();
		}
	}

	/**
	 * @returns {number}
	 */
	get channel() {
		return this.#channel;
	}

	connectedCallback() {
		this.#render();
	}

	disconnectedCallback() {
		this.replaceChildren();
		this.#hasRenderedKeys = false;
	}

	#render() {
		this.replaceChildren();
		for (let note = 0; note < 128; note++) {
			const key = this.#createKeyElement(note);
			this.append(key);
		}
		this.#hasRenderedKeys = true;
		this.#updateMappedKeys();
	}

	#createKeyElement(note) {
		const key = document.createElement('div');
		const isBlack = isBlackKey(note);
		key.className = isBlack ? 'sticky-key sticky-key--black' : 'sticky-key sticky-key--white';
		key.dataset.note = String(note);
		const noteName = `${PIANO_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
		key.title = `${noteName} (MIDI ${note})`;
		if (note % 12 === 0) {
			const label = document.createElement('span');
			label.className = 'sticky-key-label';
			label.textContent = noteName;
			key.append(label);
		}
		key.addEventListener('click', () => {
			this.#toggleFilter(note);
		});
		return key;
	}

	#toggleFilter(note) {
		if (this.#activeFilterNote === note) {
			this.#activeFilterNote = null;
		} else {
			this.#activeFilterNote = note;
		}
		this.#updateFilterHighlight();

		const mappedEntry = this.#mappings.find(
			entry => entry.channel === this.#channel && entry.note === note
		);
		this.dispatchEvent(
			new CustomEvent('stickykeyclick', {
				bubbles: true,
				detail: {
					note,
					clipId: mappedEntry?.clipId ?? null,
					isActive: this.#activeFilterNote !== null
				}
			})
		);
	}

	#updateFilterHighlight() {
		for (let note = 0; note < 128; note++) {
			const key = this.children[note];
			if (!key) {
				continue;
			}
			if (note === this.#activeFilterNote) {
				key.classList.add('sticky-key--active');
			} else {
				key.classList.remove('sticky-key--active');
			}
		}
	}

	#updateMappedKeys() {
		const channelMappingByNote = new Map();
		for (const entry of this.#mappings) {
			if (entry.channel === this.#channel) {
				channelMappingByNote.set(entry.note, entry);
			}
		}
		for (let note = 0; note < 128; note++) {
			const key = this.children[note];
			if (!key) {
				continue;
			}
			const noteName = `${PIANO_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
			const mappedEntry = channelMappingByNote.get(note);
			if (mappedEntry) {
				key.classList.add('sticky-key--mapped');
				key.title = `${noteName} (MIDI ${note}) → ${mappedEntry.clipId}`;
			} else {
				key.classList.remove('sticky-key--mapped');
				key.title = `${noteName} (MIDI ${note})`;
			}
		}
	}

	/**
	 * Clear the active filter highlight.
	 */
	clearFilter() {
		this.#activeFilterNote = null;
		if (this.#hasRenderedKeys) {
			this.#updateFilterHighlight();
		}
	}
}

customElements.define('akvj-sticky-piano-roll', AkvjStickyPianoRoll);

export default AkvjStickyPianoRoll;
