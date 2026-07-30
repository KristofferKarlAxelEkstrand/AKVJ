/**
 * MidiSettingsOverlay - Device enable checkboxes + latest event per (device, channel).
 * Toggle with 'T'. Hidden = removed from DOM. Auto-hide: 10s mouse-away, 30s idle.
 */
import defaultAppState, {
	EVENT_MIDI_NOTE_ON,
	EVENT_MIDI_NOTE_OFF,
	EVENT_MIDI_CONTROL_CHANGE,
	EVENT_MIDI_DEVICES_CHANGED
} from '../core/AppState.js';

const MOUSE_AWAY_HIDE_MS = 10_000;
const IDLE_HIDE_MS = 30_000;
const EVENT_TYPE_NOTE_ON = 'Note On';
const EVENT_TYPE_NOTE_OFF = 'Note Off';
const EVENT_TYPE_CC = 'CC';
/** Input types that are controls, not text entry — T should still toggle. */
const NON_TEXT_INPUT_TYPES = new Set(['checkbox', 'radio', 'button', 'submit', 'reset', 'file', 'image', 'hidden', 'range', 'color']);
const MIDI_SETTINGS_OVERLAY_ELEMENT_ID = 'midi-settings-overlay';

/**
 * @typedef {{ deviceId: string|null, deviceName: string|null, channel: number, eventType: string, noteOrController: number, velocityOrCcValue: number|null }} MidiReadoutEntry
 */

class MidiSettingsOverlay {
	#midi;
	#appState;
	#element;
	#deviceListElement = null;
	#readoutElement = null;
	#unsubscribers = [];
	#boundHandleKeydown;
	#boundHandlePointerEnter;
	#boundHandlePointerLeave;
	#boundResetIdleTimerFromPointer;
	#boundHandleDeviceChange;
	#isVisible = false;
	#pointerInside = false;
	#awayTimerId = null;
	#idleTimerId = null;
	/** @type {Map<string, MidiReadoutEntry>} */
	#latestByDeviceChannel = new Map();
	#awayHideMs;
	#idleHideMs;

	/**
	 * @param {{ midi: { getConnectedDevices: Function, setDeviceEnabled: Function }, appState?: object, awayHideMs?: number, idleHideMs?: number }} options
	 */
	constructor({ midi, appState = defaultAppState, awayHideMs = MOUSE_AWAY_HIDE_MS, idleHideMs = IDLE_HIDE_MS } = {}) {
		if (!midi) {
			throw new Error('MidiSettingsOverlay requires a midi instance');
		}
		this.#midi = midi;
		this.#appState = appState;
		this.#awayHideMs = awayHideMs;
		this.#idleHideMs = idleHideMs;
		this.#boundHandleKeydown = this.#handleKeydown.bind(this);
		this.#boundHandlePointerEnter = this.#handlePointerEnter.bind(this);
		this.#boundHandlePointerLeave = this.#handlePointerLeave.bind(this);
		this.#boundResetIdleTimerFromPointer = this.#resetIdleTimer.bind(this);
		this.#boundHandleDeviceChange = this.#handleDeviceChange.bind(this);
		this.#createOverlay();
	}

	#createOverlay() {
		this.#element = document.createElement('div');
		this.#element.id = MIDI_SETTINGS_OVERLAY_ELEMENT_ID;
		this.#element.setAttribute('role', 'dialog');
		this.#element.setAttribute('aria-label', 'MIDI device settings');

		const header = document.createElement('div');
		header.className = 'midi-settings-header';
		header.textContent = 'MIDI ';
		const hint = document.createElement('span');
		hint.className = 'midi-settings-hint';
		hint.textContent = '(T to toggle)';
		header.appendChild(hint);

		const devicesLabel = document.createElement('div');
		devicesLabel.className = 'midi-settings-label';
		devicesLabel.textContent = 'Inputs';

		this.#deviceListElement = document.createElement('div');
		this.#deviceListElement.className = 'midi-settings-devices';
		this.#deviceListElement.setAttribute('data-testid', 'midi-settings-devices');

		const readoutLabel = document.createElement('div');
		readoutLabel.className = 'midi-settings-label';
		readoutLabel.textContent = 'Last';

		this.#readoutElement = document.createElement('div');
		this.#readoutElement.className = 'midi-settings-readout';
		this.#readoutElement.setAttribute('data-testid', 'midi-settings-readout');

		this.#element.append(header, devicesLabel, this.#deviceListElement, readoutLabel, this.#readoutElement);
	}

	#isTypingTarget(target) {
		if (!(target instanceof Element)) {
			return false;
		}
		const targetTag = target.tagName?.toUpperCase();
		if (targetTag === 'TEXTAREA') {
			return true;
		}
		if (targetTag === 'INPUT') {
			const inputType = (target.getAttribute('type') || 'text').toLowerCase();
			return !NON_TEXT_INPUT_TYPES.has(inputType);
		}
		if (target.isContentEditable) {
			return true;
		}
		return Boolean(target.closest('[contenteditable=""], [contenteditable="true"]'));
	}

	#handleKeydown(event) {
		if (event.key !== 't' && event.key !== 'T') {
			return;
		}
		if (this.#isTypingTarget(event.target)) {
			return;
		}
		if (this.#isVisible) {
			this.#hide();
		} else {
			this.#show();
		}
	}

	#handlePointerEnter() {
		this.#pointerInside = true;
		this.#clearAwayTimer();
	}

	#handlePointerLeave() {
		this.#pointerInside = false;
		this.#startAwayTimer();
	}

	#handleDeviceChange(event) {
		const checkbox = event.target;
		if (!(checkbox instanceof HTMLInputElement) || checkbox.type !== 'checkbox') {
			return;
		}
		const deviceId = checkbox.dataset.deviceId;
		if (!deviceId) {
			return;
		}
		this.#midi.setDeviceEnabled(deviceId, checkbox.checked);
		this.#resetIdleTimer();
	}

	#show() {
		if (this.#isVisible) {
			return;
		}
		this.#isVisible = true;
		this.#pointerInside = false;
		document.body.appendChild(this.#element);
		this.#attachPaneListeners();
		this.#renderDevices();
		this.#renderReadout();
		this.#resetIdleTimer();
	}

	#hide() {
		if (!this.#isVisible) {
			return;
		}
		this.#isVisible = false;
		this.#pointerInside = false;
		this.#clearTimers();
		this.#detachPaneListeners();
		this.#element.remove();
	}

	#attachPaneListeners() {
		this.#element.addEventListener('pointerenter', this.#boundHandlePointerEnter);
		this.#element.addEventListener('pointerleave', this.#boundHandlePointerLeave);
		this.#element.addEventListener('pointerdown', this.#boundResetIdleTimerFromPointer);
		this.#element.addEventListener('pointermove', this.#boundResetIdleTimerFromPointer);
		this.#element.addEventListener('change', this.#boundHandleDeviceChange);
	}

	#detachPaneListeners() {
		this.#element.removeEventListener('pointerenter', this.#boundHandlePointerEnter);
		this.#element.removeEventListener('pointerleave', this.#boundHandlePointerLeave);
		this.#element.removeEventListener('pointerdown', this.#boundResetIdleTimerFromPointer);
		this.#element.removeEventListener('pointermove', this.#boundResetIdleTimerFromPointer);
		this.#element.removeEventListener('change', this.#boundHandleDeviceChange);
	}

	#startAwayTimer() {
		this.#clearAwayTimer();
		this.#awayTimerId = setTimeout(() => {
			this.#awayTimerId = null;
			if (!this.#pointerInside) {
				this.#hide();
			}
		}, this.#awayHideMs);
	}

	#resetIdleTimer() {
		this.#clearIdleTimer();
		this.#idleTimerId = setTimeout(() => {
			this.#idleTimerId = null;
			this.#hide();
		}, this.#idleHideMs);
	}

	#clearAwayTimer() {
		if (this.#awayTimerId !== null) {
			clearTimeout(this.#awayTimerId);
			this.#awayTimerId = null;
		}
	}

	#clearIdleTimer() {
		if (this.#idleTimerId !== null) {
			clearTimeout(this.#idleTimerId);
			this.#idleTimerId = null;
		}
	}

	#clearTimers() {
		this.#clearAwayTimer();
		this.#clearIdleTimer();
	}

	#readoutKey(deviceId, channel) {
		return `${deviceId ?? 'unknown'}:${channel}`;
	}

	#recordEvent({ deviceId = null, deviceName = null, channel, eventType, noteOrController, velocityOrCcValue = null }) {
		const key = this.#readoutKey(deviceId, channel);
		this.#latestByDeviceChannel.set(key, { deviceId, deviceName, channel, eventType, noteOrController, velocityOrCcValue });
		if (this.#isVisible) {
			this.#renderReadout();
		}
	}

	#renderDevices() {
		if (!this.#deviceListElement) {
			return;
		}
		this.#deviceListElement.replaceChildren();
		const devices = this.#midi.getConnectedDevices?.() ?? [];
		if (devices.length === 0) {
			const empty = document.createElement('div');
			empty.className = 'midi-settings-empty';
			empty.textContent = 'No MIDI inputs';
			this.#deviceListElement.appendChild(empty);
			return;
		}
		for (const device of devices) {
			const row = document.createElement('label');
			row.className = 'midi-settings-device';

			const checkbox = document.createElement('input');
			checkbox.type = 'checkbox';
			checkbox.checked = device.enabled !== false;
			checkbox.dataset.deviceId = device.id;

			const name = document.createElement('span');
			name.className = 'midi-settings-device-name';
			name.textContent = device.name ?? device.id ?? 'unknown';

			row.append(checkbox, name);
			this.#deviceListElement.appendChild(row);
		}
	}

	#formatReadoutLine(entry) {
		const deviceLabel = entry.deviceName ?? entry.deviceId ?? 'Unknown';
		const channelDisplay = entry.channel + 1;
		const valuePart = entry.velocityOrCcValue === null || entry.velocityOrCcValue === undefined ? '' : ` ${entry.velocityOrCcValue}`;
		return `${deviceLabel} CH${channelDisplay} ${entry.eventType} ${entry.noteOrController}${valuePart}`;
	}

	#renderReadout() {
		if (!this.#readoutElement) {
			return;
		}
		this.#readoutElement.replaceChildren();
		if (this.#latestByDeviceChannel.size === 0) {
			const empty = document.createElement('div');
			empty.className = 'midi-settings-empty';
			empty.textContent = '—';
			this.#readoutElement.appendChild(empty);
			return;
		}
		for (const entry of this.#latestByDeviceChannel.values()) {
			const line = document.createElement('div');
			line.className = 'midi-settings-readout-line';
			line.textContent = this.#formatReadoutLine(entry);
			this.#readoutElement.appendChild(line);
		}
	}

	mount() {
		document.addEventListener('keydown', this.#boundHandleKeydown);
		this.#subscribeToEvents();
	}

	#subscribeToEvents() {
		this.#unsubscribers.push(
			this.#appState.subscribe(EVENT_MIDI_DEVICES_CHANGED, () => {
				if (this.#isVisible) {
					this.#renderDevices();
				}
			})
		);
		this.#unsubscribers.push(
			this.#appState.subscribe(EVENT_MIDI_NOTE_ON, event => {
				const { channel, note, velocity, deviceId, deviceName } = event.detail;
				this.#recordEvent({
					deviceId,
					deviceName,
					channel,
					eventType: EVENT_TYPE_NOTE_ON,
					noteOrController: note,
					velocityOrCcValue: velocity
				});
			})
		);
		this.#unsubscribers.push(
			this.#appState.subscribe(EVENT_MIDI_NOTE_OFF, event => {
				const { channel, note, deviceId, deviceName } = event.detail;
				this.#recordEvent({
					deviceId,
					deviceName,
					channel,
					eventType: EVENT_TYPE_NOTE_OFF,
					noteOrController: note,
					velocityOrCcValue: null
				});
			})
		);
		this.#unsubscribers.push(
			this.#appState.subscribe(EVENT_MIDI_CONTROL_CHANGE, event => {
				const { channel, controller, value, deviceId, deviceName } = event.detail;
				this.#recordEvent({
					deviceId,
					deviceName,
					channel,
					eventType: EVENT_TYPE_CC,
					noteOrController: controller,
					velocityOrCcValue: value
				});
			})
		);
	}

	/**
	 * @returns {boolean}
	 */
	get isVisible() {
		return this.#isVisible;
	}

	destroy() {
		this.#hide();
		this.#removeKeydownListener();
		this.#unsubscribeAll();
		this.#latestByDeviceChannel.clear();
	}

	#removeKeydownListener() {
		try {
			document.removeEventListener('keydown', this.#boundHandleKeydown);
		} catch (error) {
			console.error('Error removing keydown listener in MidiSettingsOverlay:', error);
		}
	}

	#unsubscribeAll() {
		for (const unsubscribe of this.#unsubscribers) {
			try {
				unsubscribe();
			} catch (error) {
				console.error('Error unsubscribing in MidiSettingsOverlay:', error);
			}
		}
		this.#unsubscribers = [];
	}
}

export default MidiSettingsOverlay;
export { MOUSE_AWAY_HIDE_MS, IDLE_HIDE_MS, MIDI_SETTINGS_OVERLAY_ELEMENT_ID };
