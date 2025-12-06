import appState from '../src/js/AppState.js';
import { waitForEvent } from './utils/wait-for-event.js';

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
});
