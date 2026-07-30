import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import MidiSettingsOverlay from '../src/js/utils/MidiSettingsOverlay.js';
import { createAppState } from '../src/js/core/AppState.js';

function createFakeMidi(devices = []) {
	const list = devices.map(device => ({
		id: device.id,
		name: device.name ?? device.id,
		enabled: device.enabled !== false
	}));
	return {
		getConnectedDevices: vi.fn(() => list.map(device => ({ ...device }))),
		setDeviceEnabled: vi.fn((deviceId, enabled) => {
			const device = list.find(entry => entry.id === deviceId);
			if (device) {
				device.enabled = enabled;
			}
		}),
		_list: list
	};
}

describe('MidiSettingsOverlay', () => {
	/** @type {MidiSettingsOverlay} */
	let overlay;
	/** @type {ReturnType<typeof createAppState>} */
	let appState;
	/** @type {ReturnType<typeof createFakeMidi>} */
	let midi;

	beforeEach(() => {
		vi.useFakeTimers();
		appState = createAppState();
		midi = createFakeMidi([
			{ id: 'pad-1', name: 'Pad One', enabled: true },
			{ id: 'knob-1', name: 'Knob Rack', enabled: false }
		]);
		overlay = new MidiSettingsOverlay({
			midi,
			appState,
			awayHideMs: 10_000,
			idleHideMs: 30_000
		});
	});

	afterEach(() => {
		try {
			overlay?.destroy();
		} catch {
			// ignore
		}
		document.getElementById('midi-settings-overlay')?.remove();
		vi.useRealTimers();
	});

	test('mount registers keydown; T toggles visibility and removes from DOM when hidden', () => {
		const addSpy = vi.spyOn(document, 'addEventListener');
		overlay.mount();
		expect(addSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		addSpy.mockRestore();

		expect(document.getElementById('midi-settings-overlay')).toBeNull();
		expect(overlay.isVisible).toBe(false);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		const el = document.getElementById('midi-settings-overlay');
		expect(el).not.toBeNull();
		expect(overlay.isVisible).toBe(true);

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'T' }));
		expect(document.getElementById('midi-settings-overlay')).toBeNull();
		expect(overlay.isVisible).toBe(false);
	});

	test('keydown T does not toggle when focus is in text INPUT / TEXTAREA / contenteditable', () => {
		overlay.mount();

		const input = document.createElement('input');
		input.type = 'text';
		document.body.appendChild(input);
		const inputEvent = new KeyboardEvent('keydown', { key: 't', bubbles: true });
		Object.defineProperty(inputEvent, 'target', { value: input });
		document.dispatchEvent(inputEvent);
		expect(overlay.isVisible).toBe(false);
		input.remove();

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);
		const textareaEvent = new KeyboardEvent('keydown', { key: 't', bubbles: true });
		Object.defineProperty(textareaEvent, 'target', { value: textarea });
		document.dispatchEvent(textareaEvent);
		expect(overlay.isVisible).toBe(false);
		textarea.remove();

		const editable = document.createElement('div');
		editable.setAttribute('contenteditable', 'true');
		document.body.appendChild(editable);
		const editableEvent = new KeyboardEvent('keydown', { key: 't', bubbles: true });
		Object.defineProperty(editableEvent, 'target', { value: editable });
		document.dispatchEvent(editableEvent);
		expect(overlay.isVisible).toBe(false);
		editable.remove();
	});

	test('keydown T still toggles when a device checkbox is focused', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		expect(overlay.isVisible).toBe(true);

		const checkbox = document.querySelector('#midi-settings-overlay input[type="checkbox"]');
		expect(checkbox).not.toBeNull();
		const event = new KeyboardEvent('keydown', { key: 't', bubbles: true });
		Object.defineProperty(event, 'target', { value: checkbox });
		document.dispatchEvent(event);
		expect(overlay.isVisible).toBe(false);
		expect(document.getElementById('midi-settings-overlay')).toBeNull();
	});

	test('shows checkbox list and toggles enable via Midi API', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

		const devices = document.querySelector('[data-testid="midi-settings-devices"]');
		const checkboxes = [...devices.querySelectorAll('input[type="checkbox"]')];
		expect(checkboxes).toHaveLength(2);
		expect(checkboxes[0].checked).toBe(true);
		expect(checkboxes[1].checked).toBe(false);
		expect(devices.textContent).toContain('Pad One');
		expect(devices.textContent).toContain('Knob Rack');

		checkboxes[0].checked = false;
		checkboxes[0].dispatchEvent(new Event('change', { bubbles: true }));
		expect(midi.setDeviceEnabled).toHaveBeenCalledWith('pad-1', false);
	});

	test('empty inputs show No MIDI inputs empty state', () => {
		overlay.destroy();
		midi = createFakeMidi([]);
		overlay = new MidiSettingsOverlay({
			midi,
			appState,
			awayHideMs: 10_000,
			idleHideMs: 30_000
		});
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

		const devices = document.querySelector('[data-testid="midi-settings-devices"]');
		expect(devices.textContent).toContain('No MIDI inputs');
		expect(devices.querySelectorAll('input[type="checkbox"]')).toHaveLength(0);
	});

	test('readout shows newest line per (device, channel)', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

		appState.dispatchMIDINoteOn(0, 60, 100, { deviceId: 'pad-1', deviceName: 'Pad One' });
		appState.dispatchMIDIControlChange(1, 7, 64, { deviceId: 'pad-1', deviceName: 'Pad One' });
		appState.dispatchMIDINoteOn(0, 62, 80, { deviceId: 'pad-1', deviceName: 'Pad One' });

		const readout = document.querySelector('[data-testid="midi-settings-readout"]');
		const lines = [...readout.querySelectorAll('.midi-settings-readout-line')].map(node => node.textContent);
		expect(lines).toHaveLength(2);
		expect(lines).toContain('Pad One CH1 Note On 62 80');
		expect(lines).toContain('Pad One CH2 CC 7 64');
		expect(lines.some(line => line.includes('60'))).toBe(false);
	});

	test('Note Off readout has no trailing value', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

		appState.dispatchMIDINoteOff(0, 60, { deviceId: 'pad-1', deviceName: 'Pad One' });

		const readout = document.querySelector('[data-testid="midi-settings-readout"]');
		const lines = [...readout.querySelectorAll('.midi-settings-readout-line')].map(node => node.textContent);
		expect(lines).toEqual(['Pad One CH1 Note Off 60']);
	});

	test('constructor without midi throws', () => {
		expect(() => new MidiSettingsOverlay({})).toThrow(/requires a midi instance/);
	});

	test('auto-hides after mouse-away timeout when pointer left', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		const el = document.getElementById('midi-settings-overlay');

		el.dispatchEvent(new Event('pointerenter'));
		el.dispatchEvent(new Event('pointerleave'));
		expect(overlay.isVisible).toBe(true);

		vi.advanceTimersByTime(9_999);
		expect(overlay.isVisible).toBe(true);

		vi.advanceTimersByTime(1);
		expect(overlay.isVisible).toBe(false);
		expect(document.getElementById('midi-settings-overlay')).toBeNull();
	});

	test('pointer inside cancels mouse-away hide; idle timeout still hides', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		const el = document.getElementById('midi-settings-overlay');

		el.dispatchEvent(new Event('pointerenter'));
		el.dispatchEvent(new Event('pointerleave'));
		el.dispatchEvent(new Event('pointerenter'));
		vi.advanceTimersByTime(10_000);
		expect(overlay.isVisible).toBe(true);

		vi.advanceTimersByTime(20_000);
		expect(overlay.isVisible).toBe(false);
	});

	test('activity resets idle timer', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		const el = document.getElementById('midi-settings-overlay');

		vi.advanceTimersByTime(29_000);
		el.dispatchEvent(new Event('pointerdown'));
		vi.advanceTimersByTime(29_000);
		expect(overlay.isVisible).toBe(true);
		vi.advanceTimersByTime(1_000);
		expect(overlay.isVisible).toBe(false);
	});

	test('midiDevicesChanged refreshes device list while visible', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));

		midi._list.push({ id: 'new-1', name: 'New Pad', enabled: true });
		appState.dispatchMIDIDevicesChanged(midi.getConnectedDevices());

		const devices = document.querySelector('[data-testid="midi-settings-devices"]');
		expect(devices.textContent).toContain('New Pad');
		expect(devices.querySelectorAll('input[type="checkbox"]')).toHaveLength(3);
	});

	test('destroy is idempotent and removes keydown listener', () => {
		overlay.mount();
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 't' }));
		const removeSpy = vi.spyOn(document, 'removeEventListener');
		overlay.destroy();
		expect(removeSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		expect(document.getElementById('midi-settings-overlay')).toBeNull();
		expect(() => overlay.destroy()).not.toThrow();
		removeSpy.mockRestore();
	});
});
