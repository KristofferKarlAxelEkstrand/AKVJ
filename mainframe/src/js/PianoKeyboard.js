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
 * AkvjPianoKeyboard — custom element encapsulating the 128-key piano keyboard
 * for MIDI clip mapping. Renders keys, highlights mapped notes on the current
 * channel, and dispatches `pianokeyclick` events when keys are clicked.
 *
 * @fires AkvjPianoKeyboard#pianokeyclick - CustomEvent with `{ detail: { note } }`
 */
class AkvjPianoKeyboard extends HTMLElement {
	/** @type {Array<{channel: number, note: number, velocity: number, clipId: string}>} */
	#mappings = [];
	#channel = 1;

	static get observedAttributes() {
		return ['channel'];
	}

	attributeChangedCallback(name, oldValue, value) {
		if (name === 'channel' && oldValue !== value) {
			this.#channel = Number(value) || 1;
			this.#render();
		}
	}

	/**
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} mappings
	 */
	set mappings(mappings) {
		this.#mappings = mappings;
		this.#render();
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
		this.setAttribute('channel', String(channel));
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
	}

	#render() {
		this.replaceChildren();
		const channelMappings = this.#mappings.filter(entry => entry.channel === this.#channel);
		for (let note = 0; note < 128; note++) {
			const key = document.createElement('div');
			const isBlack = isBlackKey(note);
			key.className = isBlack ? 'piano-key piano-key--black' : 'piano-key piano-key--white';
			key.dataset.note = String(note);
			const noteName = `${PIANO_NOTE_NAMES[note % 12]}${Math.floor(note / 12) - 1}`;
			const mappedEntry = channelMappings.find(entry => entry.note === note);
			if (mappedEntry) {
				key.classList.add('piano-key--mapped');
				key.title = `${noteName} (MIDI ${note}) → ${mappedEntry.clipId}`;
			} else {
				key.title = `${noteName} (MIDI ${note})`;
			}
			if (note % 12 === 0) {
				const label = document.createElement('span');
				label.className = 'piano-key-label';
				label.textContent = noteName;
				key.append(label);
			}
			key.addEventListener('click', () => {
				this.dispatchEvent(
					new CustomEvent('pianokeyclick', {
						bubbles: true,
						detail: { note }
					})
				);
			});
			this.append(key);
		}
	}
}

customElements.define('akvj-piano-keyboard', AkvjPianoKeyboard);

export default AkvjPianoKeyboard;
