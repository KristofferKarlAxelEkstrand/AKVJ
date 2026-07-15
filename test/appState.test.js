import appState, { AppState, EVENT_MIDI_CONNECTION_CHANGED, EVENT_ANIMATIONS_LOADED_CHANGED, EVENT_BPM_CHANGED, EVENT_VIDEO_JOCKEY_READY } from '../src/js/core/AppState.js';
import { waitForEvent } from './utils/waitForEvent.js';
import settings from '../src/js/core/settings.js';

describe('AppState', () => {
	beforeEach(() => {
		appState.reset();
	});

	test('subscribe and dispatchVideoJockeyReady works', async () => {
		const promise = waitForEvent(appState, EVENT_VIDEO_JOCKEY_READY);
		appState.dispatchVideoJockeyReady();
		await promise;
	});

	test('midiConnected setter fires event', async () => {
		const promise = waitForEvent(appState, EVENT_MIDI_CONNECTION_CHANGED);
		appState.midiConnected = true;
		const event = await promise;
		expect(event.detail.connected).toBe(true);
	});

	test('reset() clears state without dispatching events', () => {
		// Set state to non-default values
		appState.midiConnected = true;
		appState.animationsLoaded = true;

		// Subscribe to events - these should NOT fire during reset
		const midiHandler = vi.fn();
		const animationsHandler = vi.fn();
		const unsubMidi = appState.subscribe(EVENT_MIDI_CONNECTION_CHANGED, midiHandler);
		const unsubAnimations = appState.subscribe(EVENT_ANIMATIONS_LOADED_CHANGED, animationsHandler);

		// Reset state
		appState.reset();

		// Verify state was reset
		expect(appState.midiConnected).toBe(false);
		expect(appState.animationsLoaded).toBe(false);

		// Verify no events were dispatched during reset
		expect(midiHandler).not.toHaveBeenCalled();
		expect(animationsHandler).not.toHaveBeenCalled();

		// Cleanup
		unsubMidi();
		unsubAnimations();
	});

	test('dispatchMIDIClock uses configured ppqn for BPM calculation', async () => {
		const config = JSON.parse(JSON.stringify(settings));
		config.midi.ppqn = 48;
		const state = new AppState(config);

		const promise = waitForEvent(state, EVENT_BPM_CHANGED);

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
