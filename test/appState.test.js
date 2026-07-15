import appState, { AppState } from '../src/js/core/AppState.js';
import { waitForEvent } from './utils/waitForEvent.js';
import settings from '../src/js/core/settings.js';

describe('AppState', () => {
	beforeEach(() => {
		appState.reset();
	});

	test('subscribe and dispatchVideoJockeyReady works', async () => {
		const promise = waitForEvent(appState, 'videoJockeyReady');
		appState.dispatchVideoJockeyReady();
		await promise;
	});

	test('midiConnected setter fires event', async () => {
		const promise = waitForEvent(appState, 'midiConnectionChanged');
		appState.midiConnected = true;
		const event = await promise;
		expect(event.detail.connected).toBe(true);
	});

	test('reset() clears state without dispatching events', () => {
		// Set state to non-default values
		appState.midiConnected = true;
		appState.clipsLoaded = true;

		// Subscribe to events - these should NOT fire during reset
		const midiHandler = vi.fn();
		const clipsHandler = vi.fn();
		const unsubMidi = appState.subscribe('midiConnectionChanged', midiHandler);
		const unsubClips = appState.subscribe('clipsLoadedChanged', clipsHandler);

		// Reset state
		appState.reset();

		// Verify state was reset
		expect(appState.midiConnected).toBe(false);
		expect(appState.clipsLoaded).toBe(false);

		// Verify no events were dispatched during reset
		expect(midiHandler).not.toHaveBeenCalled();
		expect(clipsHandler).not.toHaveBeenCalled();

		// Cleanup
		unsubMidi();
		unsubClips();
	});

	test('dispatchMIDIClock uses configured ppqn for BPM calculation', async () => {
		const config = JSON.parse(JSON.stringify(settings));
		config.midi.ppqn = 48;
		const state = new AppState(config);

		const promise = waitForEvent(state, 'bpmChanged');

		// Simulate a sequence of evenly spaced clock pulses (10ms apart)
		const interval = 10;
		for (let i = 0; i < 7; i++) {
			state.dispatchMIDIClock(i * interval);
		}

		const event = await promise;
		// Expected BPM = 60000 / (interval * PPQN) = 60000 / (10 * 48) = 125
		expect(event.detail.bpm).toBeCloseTo(125, 1);
	});

	test('clipsLoaded setter fires event with loaded detail', async () => {
		const promise = waitForEvent(appState, 'clipsLoadedChanged');
		appState.clipsLoaded = true;
		const event = await promise;
		expect(event.detail.loaded).toBe(true);
		expect(appState.clipsLoaded).toBe(true);
	});

	test('clipsLoaded setter does not fire event when value is unchanged', () => {
		appState.clipsLoaded = false; // already false from reset
		const handler = vi.fn();
		const unsub = appState.subscribe('clipsLoadedChanged', handler);
		appState.clipsLoaded = false;
		expect(handler).not.toHaveBeenCalled();
		unsub();
	});

	test('dispatchMIDIControlChange sets BPM from CC when on correct channel/controller', async () => {
		const promise = waitForEvent(appState, 'bpmChanged');
		// CC 0 on channel 0 with value 0 -> min BPM
		appState.dispatchMIDIControlChange(settings.bpm.controlChannel, settings.bpm.controlCC, 0);
		const event = await promise;
		expect(event.detail.bpm).toBe(settings.bpm.min);
		expect(event.detail.source).toBe('cc');
	});

	test('dispatchMIDIControlChange does not change BPM on wrong channel', () => {
		const handler = vi.fn();
		const unsub = appState.subscribe('bpmChanged', handler);
		appState.dispatchMIDIControlChange(99, settings.bpm.controlCC, 64);
		expect(handler).not.toHaveBeenCalled();
		unsub();
	});

	test('dispatchMIDIControlChange does not change BPM on wrong CC number', () => {
		const handler = vi.fn();
		const unsub = appState.subscribe('bpmChanged', handler);
		appState.dispatchMIDIControlChange(settings.bpm.controlChannel, 99, 64);
		expect(handler).not.toHaveBeenCalled();
		unsub();
	});

	test('dispatchMIDIControlChange dispatches CC event with channel, controller, value', async () => {
		const promise = waitForEvent(appState, 'midiControlChange');
		appState.dispatchMIDIControlChange(3, 7, 42);
		const event = await promise;
		expect(event.detail.channel).toBe(3);
		expect(event.detail.controller).toBe(7);
		expect(event.detail.value).toBe(42);
	});

	test('bpm setter clamps to min/max range', () => {
		appState.bpm = 1; // below min
		expect(appState.bpm).toBe(settings.bpm.min);

		appState.bpm = 9999; // above max
		expect(appState.bpm).toBe(settings.bpm.max);
	});

	test('bpm setter sets source to manual', async () => {
		const promise = waitForEvent(appState, 'bpmChanged');
		appState.bpm = 200;
		const event = await promise;
		expect(event.detail.source).toBe('manual');
		expect(appState.bpmSource).toBe('manual');
	});

	test('bpmSource getter returns default after reset', () => {
		appState.bpm = 200;
		expect(appState.bpmSource).toBe('manual');
		appState.reset();
		expect(appState.bpmSource).toBe('default');
	});

	test('dispatchMIDIStart resets clock state and dispatches event', async () => {
		const promise = waitForEvent(appState, 'midiStart');
		appState.dispatchMIDIStart();
		await promise;
	});

	test('dispatchMIDIStop dispatches event', async () => {
		const promise = waitForEvent(appState, 'midiStop');
		appState.dispatchMIDIStop();
		await promise;
	});

	test('dispatchMIDIContinue dispatches event', async () => {
		const promise = waitForEvent(appState, 'midiContinue');
		appState.dispatchMIDIContinue();
		await promise;
	});

	test('dispatchMIDINoteOn dispatches event with channel, note, velocity', async () => {
		const promise = waitForEvent(appState, 'midiNoteOn');
		appState.dispatchMIDINoteOn(0, 60, 127);
		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		expect(event.detail.velocity).toBe(127);
	});

	test('dispatchMIDINoteOff dispatches event with channel, note', async () => {
		const promise = waitForEvent(appState, 'midiNoteOff');
		appState.dispatchMIDINoteOff(0, 60);
		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
	});

	test('subscribe returns unsubscribe function that removes listener', () => {
		const handler = vi.fn();
		const unsub = appState.subscribe('midiNoteOn', handler);
		expect(typeof unsub).toBe('function');
		appState.dispatchMIDINoteOn(0, 60, 127);
		expect(handler).toHaveBeenCalledTimes(1);
		unsub();
		appState.dispatchMIDINoteOn(0, 60, 127);
		expect(handler).toHaveBeenCalledTimes(1);
	});

	test('midiConnected setter does not fire event when value is unchanged', () => {
		const handler = vi.fn();
		const unsub = appState.subscribe('midiConnectionChanged', handler);
		appState.midiConnected = false; // already false
		expect(handler).not.toHaveBeenCalled();
		unsub();
	});
});
