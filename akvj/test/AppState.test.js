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
});
