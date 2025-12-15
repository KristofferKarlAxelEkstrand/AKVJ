import appState from '../src/js/core/AppState.js';
import { waitForEvent } from './utils/wait-for-event.js';
import settings from '../src/js/core/settings.js';

describe('AppState', () => {
	beforeEach(() => {
		appState.reset();
	});

	test('subscribe and notifyVideoJockeyReady works', async () => {
		const promise = waitForEvent(appState, 'videoJockeyReady');
		appState.notifyVideoJockeyReady();
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
		appState.animationsLoaded = true;

		// Subscribe to events - these should NOT fire during reset
		const midiHandler = vi.fn();
		const animationsHandler = vi.fn();
		const unsubMidi = appState.subscribe('midiConnectionChanged', midiHandler);
		const unsubAnimations = appState.subscribe('animationsLoadedChanged', animationsHandler);

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

	test('dispatchMIDIClock uses settings.midi.ppqn for BPM calculation', async () => {
		const originalPPQN = settings.midi.ppqn;
		// Use a non-default PPQN to ensure code uses the setting
		settings.midi.ppqn = 48;

		// Prepare to wait for bpmChanged event
		const promise = waitForEvent(appState, 'bpmChanged');

		// Ensure PPQN was set correctly
		expect(settings.midi.ppqn).toBe(48);

		// Simulate a sequence of evenly spaced clock pulses (10ms apart)
		const interval = 10;
		for (let i = 0; i < 7; i++) {
			appState.dispatchMIDIClock(i * interval);
		}

		const event = await promise;
		// Expected BPM = 60000 / (interval * PPQN) = 60000 / (10 * 48) = 125
		expect(event.detail.bpm).toBeCloseTo(125, 1);

		// Restore original PPQN
		settings.midi.ppqn = originalPPQN;
	});
});
