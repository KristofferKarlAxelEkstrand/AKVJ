// Using fixtures for setup/teardown
import { waitForEvent } from './utils/waitForEvent.js';
import { getListeners, invokeListeners } from './utils/invokeListeners.js';
import { useFakeMIDIFixture } from './utils/midiFixture.js';

// Global requestMIDIAccess is now handled by `useFakeMIDIFixture()` fixture

describe('MIDI', () => {
	const { getEnv, recreateEnv } = useFakeMIDIFixture([{ id: 'fake-1', name: 'Fake MIDI Input' }]);

	test('dispatches midiNoteOn when Note On message received', async () => {
		const env = getEnv();

		// Reset modules to get fresh instances with the fake MIDI environment
		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi();
		await midi.ready;

		// Wait for event from AppState
		const promise = waitForEvent(appState, 'midiNoteOn');

		// Simulate a Note On message (status 0x90 = Note On channel 0), note 60, velocity 127
		const fakeInput = env.getInputById('fake-1');
		invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x90, 60, 127]) });

		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		expect(event.detail.velocity).toBe(127);

		midi.destroy();
	});

	test('Note On with velocity 0 dispatches midiNoteOff', async () => {
		const env = recreateEnv([{ id: 'fake-2', name: 'Fake MIDI Input 2' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi();
		await midi.ready;
		const promise = waitForEvent(appState, 'midiNoteOff');
		const fakeInput = env.getInputById('fake-2');
		invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x90, 60, 0]) }); // velocity 0 -> Note Off
		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		midi.destroy();
	});

	test('Note Off command dispatches midiNoteOff', async () => {
		const env = recreateEnv([{ id: 'fake-3', name: 'Fake MIDI Input 3' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi();
		await midi.ready;
		const promise = waitForEvent(appState, 'midiNoteOff');
		const fakeInput = env.getInputById('fake-3');
		invokeListeners(fakeInput, 'midimessage', { data: new Uint8Array([0x80, 60, 127]) }); // Note Off command
		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		midi.destroy();
	});

	test('ignores malformed messages (length < 3)', async () => {
		const env = recreateEnv([{ id: 'fake-4', name: 'Fake MIDI Input 4' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi();
		await midi.ready;

		const fakeInput = env.getInputById('fake-4');

		// Spy on dispatch methods to verify no events are fired
		const noteOnSpy = vi.spyOn(appState, 'dispatchMIDINoteOn');
		const noteOffSpy = vi.spyOn(appState, 'dispatchMIDINoteOff');

		// Test various malformed message lengths
		const testCases = [
			{ data: new Uint8Array([]), description: 'empty message (length 0)' },
			{ data: new Uint8Array([0x90]), description: 'single-byte message (length 1)' },
			{ data: new Uint8Array([0x90, 60]), description: 'two-byte message (length 2)' }
		];

		for (const testCase of testCases) {
			invokeListeners(fakeInput, 'midimessage', { data: testCase.data });
		}

		// Verify no MIDI events were dispatched
		expect(noteOnSpy).not.toHaveBeenCalled();
		expect(noteOffSpy).not.toHaveBeenCalled();

		noteOnSpy.mockRestore();
		noteOffSpy.mockRestore();
		midi.destroy();
	});

	test('destroy clears inputs and updates appState.midiConnected', async () => {
		const env = recreateEnv([{ id: 'fake-5', name: 'Fake MIDI Input 5' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const Midi = (await import('../src/js/midi-input/Midi.js')).default;
		const midi = new Midi();
		await midi.ready;

		// MIDI connection is set during construction - check state directly
		expect(appState.midiConnected).toBe(true);

		// The device should be present
		expect(midi.getConnectedDevices()).toEqual(['Fake MIDI Input 5']);

		// Handler should be a function
		// Handler should be present in listeners
		const fakeInput = env.getInputById('fake-5');
		expect(getListeners(fakeInput, 'midimessage').length).toBeGreaterThan(0);

		// Call midi.destroy() here to assert immediate state changes synchronously
		midi.destroy();
		// Assert immediate state changes synchronously
		expect(midi.getConnectedDevices()).toEqual([]);
		expect(appState.midiConnected).toBe(false);
		expect(getListeners(fakeInput, 'midimessage').length).toBe(0);
	});

	test('hotplug connect/disconnect triggers appState and getConnectedDevices', async () => {
		const env = recreateEnv([]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const Midi = (await import('../src/js/midi-input/Midi.js')).default;
		const midi = new Midi();
		await midi.ready;

		// Initially no devices
		expect(appState.midiConnected).toBe(false);
		expect(midi.getConnectedDevices()).toEqual([]);

		// Connect a new input dynamically and verify state updates
		env.connectInput('hotplug-1');
		expect(midi.getConnectedDevices()).toEqual(['hotplug-1']);
		expect(appState.midiConnected).toBe(true);

		// Disconnect it
		env.disconnectInput('hotplug-1');
		expect(midi.getConnectedDevices()).toEqual([]);
		expect(appState.midiConnected).toBe(false);

		midi.destroy();
	});
});
