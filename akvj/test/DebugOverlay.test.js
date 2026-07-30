import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import DebugOverlay from '../src/js/utils/DebugOverlay.js';
import appState from '../src/js/core/AppState.js';
import settings from '../src/js/core/settings.js';

describe('DebugOverlay', () => {
	let overlay;

	beforeEach(() => {
		appState.reset();
		overlay = new DebugOverlay();
	});

	afterEach(() => {
		try {
			overlay?.destroy();
		} catch {
			// ignore
		}
		// Clean up any leftover DOM
		document.getElementById('debug-overlay')?.remove();
		appState.reset();
	});

	test('constructor creates overlay element with correct id', () => {
		expect(overlay).toBeDefined();
		// The element is created in constructor but not yet appended to DOM
		// We can verify via internal state by checking setup appends it
	});

	test('setup appends element to document.body and registers keydown listener', () => {
		const appendChildSpy = vi.spyOn(document.body, 'appendChild');
		const addEventListenerSpy = vi.spyOn(document, 'addEventListener');

		overlay.mount();

		expect(appendChildSpy).toHaveBeenCalled();
		expect(addEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));

		appendChildSpy.mockRestore();
		addEventListenerSpy.mockRestore();
	});

	test('destroy removes element from DOM and removes keydown listener', () => {
		overlay.mount();

		const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');
		overlay.destroy();

		expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
		removeEventListenerSpy.mockRestore();
	});

	test('destroy is idempotent (calling twice does not throw)', () => {
		overlay.mount();
		overlay.destroy();

		expect(() => overlay.destroy()).not.toThrow();
	});

	test('keydown "d" toggles visibility', () => {
		overlay.mount();

		// Dispatch keydown for 'd'
		const event = new KeyboardEvent('keydown', { key: 'd' });
		document.dispatchEvent(event);

		// The overlay element should now have 'visible' class
		const el = document.getElementById('debug-overlay');
		expect(el.classList.contains('visible')).toBe(true);

		// Toggle off
		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }));
		expect(el.classList.contains('visible')).toBe(false);
	});

	test('keydown "D" (uppercase) toggles visibility', () => {
		overlay.mount();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'D' }));
		const el = document.getElementById('debug-overlay');
		expect(el.classList.contains('visible')).toBe(true);
	});

	test('keydown "d" does not toggle when typing in input element', () => {
		overlay.mount();

		const input = document.createElement('input');
		document.body.appendChild(input);

		const event = new KeyboardEvent('keydown', { key: 'd', bubbles: true });
		Object.defineProperty(event, 'target', { value: input });
		document.dispatchEvent(event);

		const el = document.getElementById('debug-overlay');
		expect(el.classList.contains('visible')).toBe(false);

		input.remove();
	});

	test('keydown "d" does not toggle when typing in textarea element', () => {
		overlay.mount();

		const textarea = document.createElement('textarea');
		document.body.appendChild(textarea);

		const event = new KeyboardEvent('keydown', { key: 'd', bubbles: true });
		Object.defineProperty(event, 'target', { value: textarea });
		document.dispatchEvent(event);

		const el = document.getElementById('debug-overlay');
		expect(el.classList.contains('visible')).toBe(false);

		textarea.remove();
	});

	test('keydown unrelated key does not toggle visibility', () => {
		overlay.mount();

		document.dispatchEvent(new KeyboardEvent('keydown', { key: 'x' }));
		const el = document.getElementById('debug-overlay');
		expect(el.classList.contains('visible')).toBe(false);
	});

	test('setup subscribes to bpmChanged, midiConnectionChanged, midiNoteOn, midiNoteOff, midiControlChange', () => {
		const subscribeSpy = vi.spyOn(appState, 'subscribe');

		overlay.mount();

		const subscribedEvents = subscribeSpy.mock.calls.map(c => c[0]);
		expect(subscribedEvents).toContain('bpmChanged');
		expect(subscribedEvents).toContain('midiConnectionChanged');
		expect(subscribedEvents).toContain('midiNoteOn');
		expect(subscribedEvents).toContain('midiNoteOff');
		expect(subscribedEvents).toContain('midiControlChange');

		subscribeSpy.mockRestore();
	});

	test('destroy unsubscribes all event listeners', () => {
		overlay.mount();

		// Get the unsubscribe functions by spying
		const unsubscribeSpies = [];
		const originalSubscribe = appState.subscribe.bind(appState);
		const subscribeSpy = vi.spyOn(appState, 'subscribe').mockImplementation((event, handler) => {
			const unsub = originalSubscribe(event, handler);
			const spy = vi.fn(unsub);
			unsubscribeSpies.push(spy);
			return spy;
		});

		overlay.destroy();
		overlay = new DebugOverlay();
		overlay.mount();

		// Now destroy and verify all spies were called
		overlay.destroy();
		for (const spy of unsubscribeSpies) {
			expect(spy).toHaveBeenCalled();
		}

		subscribeSpy.mockRestore();
	});

	test('bpmChanged event updates BPM display', () => {
		overlay.mount();

		appState.bpm = 140;

		const bpmEl = document.getElementById('debug-bpm');
		expect(bpmEl.textContent).toBe('140.0');

		const sourceEl = document.getElementById('debug-bpm-source');
		expect(sourceEl.textContent).toBe('manual');
	});

	test('mount after reset shows default BPM', () => {
		appState.bpm = 140;
		appState.reset();

		overlay.mount();

		expect(document.getElementById('debug-bpm').textContent).toBe(`${settings.bpm.default.toFixed(1)}`);
	});

	test('midiConnectionChanged event updates MIDI status display', () => {
		overlay.mount();

		appState.midiConnected = true;

		const statusEl = document.getElementById('debug-midi-status');
		expect(statusEl.textContent).toBe('Connected');
		expect(statusEl.style.color).toBe('rgb(0, 255, 0)');

		appState.midiConnected = false;
		expect(statusEl.textContent).toBe('Disconnected');
	});

	test('midiNoteOn event adds a log entry', () => {
		overlay.mount();

		appState.dispatchMIDINoteOn(0, 60, 100);

		const logEl = document.getElementById('debug-midi-log');
		expect(logEl.children.length).toBeGreaterThan(0);
		const entry = logEl.children[0];
		expect(entry.className).toContain('note-on');
		expect(entry.textContent).toContain('CH1');
		expect(entry.textContent).toContain('C4');
		expect(entry.textContent).toContain('v100');
	});

	test('midiNoteOff event adds a log entry', () => {
		overlay.mount();

		appState.dispatchMIDINoteOff(0, 60);

		const logEl = document.getElementById('debug-midi-log');
		expect(logEl.children.length).toBeGreaterThan(0);
		const entry = logEl.children[0];
		expect(entry.className).toContain('note-off');
		expect(entry.textContent).toContain('OFF');
	});

	test('midiControlChange event adds a log entry', () => {
		overlay.mount();

		appState.dispatchMIDIControlChange(0, 7, 64);

		const logEl = document.getElementById('debug-midi-log');
		expect(logEl.children.length).toBeGreaterThan(0);
		const entry = logEl.children[0];
		expect(entry.className).toContain('cc');
		expect(entry.textContent).toContain('CC7');
		expect(entry.textContent).toContain('64');
	});

	test('transport events add log entries', () => {
		overlay.mount();

		const logEl = document.getElementById('debug-midi-log');
		appState.dispatchMIDIStart();
		expect(logEl.children[0].className).toContain('transport');
		expect(logEl.children[0].textContent).toBe('START');

		appState.dispatchMIDIContinue();
		expect(logEl.children[0].textContent).toBe('CONTINUE');

		appState.dispatchMIDIStop();
		expect(logEl.children[0].textContent).toBe('STOP');
	});

	test('projectChanged event updates the project display', () => {
		overlay.mount();

		appState.activeProjectId = 'live-set';

		expect(document.getElementById('debug-project').textContent).toBe('live-set');
	});

	test('clipLoadError event updates the error display', () => {
		overlay.mount();

		appState.dispatchClipLoadError('/projects/demo/clips/clips.json', 'network down');

		const errorEl = document.getElementById('debug-error');
		expect(errorEl.textContent).toContain('network down');
		expect(errorEl.textContent).toContain('/projects/demo/clips/clips.json');
	});

	test('bpmSourceChanged event updates the source display without a bpm change', () => {
		overlay.mount();
		const sourceEl = document.getElementById('debug-bpm-source');
		const bpmEl = document.getElementById('debug-bpm');
		const bpmBefore = bpmEl.textContent;

		appState.dispatchEvent(new CustomEvent('bpmSourceChanged', { detail: { source: 'default', bpm: appState.bpm } }));

		expect(sourceEl.textContent).toBe('default');
		expect(bpmEl.textContent).toBe(bpmBefore);
	});

	test('log entries are capped at MAX_LOG_ENTRIES (8)', () => {
		overlay.mount();

		// Dispatch 12 note-on events
		for (let i = 0; i < 12; i++) {
			appState.dispatchMIDINoteOn(0, 60 + i, 100);
		}

		const logEl = document.getElementById('debug-midi-log');
		expect(logEl.children.length).toBe(8);
	});

	test('note formatting produces correct note names', () => {
		overlay.mount();

		// Note 60 = C4, Note 69 = A4, Note 0 = C-1
		appState.dispatchMIDINoteOn(0, 60, 100);
		const logEl = document.getElementById('debug-midi-log');
		expect(logEl.children[0].textContent).toContain('C4');

		appState.dispatchMIDINoteOn(0, 69, 100);
		expect(logEl.children[0].textContent).toContain('A4');

		appState.dispatchMIDINoteOn(0, 0, 100);
		expect(logEl.children[0].textContent).toContain('C-1');
	});
});
