import '../scss/KeyBed.scss';
import { PianoKey, buildVelocityBands } from './PianoKey.js';

const KEY_COUNT = 128;

/**
 * KeyBed — custom element that owns the 128-key container with flex layout,
 * horizontal scroll, and key instantiation.
 *
 * Exposes a `keys` getter and a `setMappedKeys()` method so `PianoRoll`
 * doesn't need to iterate children manually.
 *
 * @extends HTMLElement
 */
class KeyBed extends HTMLElement {
	/** @type {PianoKey[]} */
	#keys = [];
	#hasRendered = false;

	connectedCallback() {
		if (!this.#hasRendered) {
			this.#renderKeys();
		}
	}

	disconnectedCallback() {
		this.replaceChildren();
		this.#keys = [];
		this.#hasRendered = false;
	}

	/**
	 * Array of the 128 `<piano-key>` children, ordered by note (0–127).
	 * @returns {PianoKey[]}
	 */
	get keys() {
		if (!this.#hasRendered) {
			this.#renderKeys();
		}
		return this.#keys;
	}

	/**
	 * Update each key's mapped state, clip ID, and velocity bands based on
	 * channel-filtered mappings and the current interaction mode.
	 *
	 * @param {Array<{channel: number, note: number, velocity: number, clipId: string}>} channelMappings - mappings already filtered to the current channel
	 * @param {'edit'|'select'|'filter'|'play'} mode
	 */
	setMappedKeys(channelMappings, mode) {
		if (!this.#hasRendered) {
			this.#renderKeys();
		}
		for (const key of this.#keys) {
			const noteMappings = channelMappings.filter(mapping => mapping.note === key.note).sort((a, b) => a.velocity - b.velocity);
			if (mode === 'edit' || mode === 'filter' || mode === 'select') {
				const bands = buildVelocityBands(noteMappings);
				key.velocityBands = bands;
				key.mapped = bands.length > 0;
				key.clipId = bands[0]?.clipId ?? null;
			} else {
				key.velocityBands = [];
				const first = noteMappings[0] ?? null;
				key.mapped = Boolean(first);
				key.clipId = first?.clipId ?? null;
			}
		}
	}

	#renderKeys() {
		const fragment = document.createDocumentFragment();
		for (let note = 0; note < KEY_COUNT; note++) {
			const key = new PianoKey();
			key.note = note;
			this.#keys.push(key);
			fragment.append(key);
		}
		this.append(fragment);
		this.#hasRendered = true;
	}
}

if (!customElements.get('key-bed')) {
	customElements.define('key-bed', KeyBed);
}

export { KeyBed };
