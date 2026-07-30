// Using fixtures for setup/teardown
import { waitForEvent } from './utils/waitForEvent.js';
import { getListeners, invokeListeners } from './utils/invokeListeners.js';
import { useFakeMIDIFixture } from './utils/midiFixture.js';
import { dispatchMidiMessage } from './utils/fakeMidi.js';

// Must match Midi.js UNCHECKED_DEVICES_STORAGE_KEY (avoid static Midi import before resetModules).
const UNCHECKED_DEVICES_STORAGE_KEY = 'akvj.midi.uncheckedDeviceIds';

// Global requestMIDIAccess is now handled by `useFakeMIDIFixture()` fixture

function createMemoryStorage(initial = {}) {
	const map = new Map(Object.entries(initial));
	return {
		getItem(key) {
			return map.has(key) ? map.get(key) : null;
		},
		setItem(key, value) {
			map.set(key, String(value));
		},
		removeItem(key) {
			map.delete(key);
		},
		clear() {
			map.clear();
		}
	};
}

describe('MIDI', () => {
	const { getEnv, recreateEnv } = useFakeMIDIFixture([{ id: 'fake-1', name: 'Fake MIDI Input' }]);

	test('dispatches midiNoteOn when Note On message received', async () => {
		const env = getEnv();

		// Reset modules to get fresh instances with the fake MIDI environment
		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		// Wait for event from AppState
		const promise = waitForEvent(appState, 'midiNoteOn');

		// Simulate a Note On message (status 0x90 = Note On channel 0), note 60, velocity 127
		const fakeInput = env.getInputById('fake-1');
		dispatchMidiMessage(fakeInput, [0x90, 60, 127]);

		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		expect(event.detail.velocity).toBe(127);
		expect(event.detail.deviceId).toBe('fake-1');
		expect(event.detail.deviceName).toBe('Fake MIDI Input');

		midi.destroy();
	});

	test('Note On with velocity 0 dispatches midiNoteOff', async () => {
		const env = recreateEnv([{ id: 'fake-2', name: 'Fake MIDI Input 2' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;
		const promise = waitForEvent(appState, 'midiNoteOff');
		const fakeInput = env.getInputById('fake-2');
		dispatchMidiMessage(fakeInput, [0x90, 60, 0]); // velocity 0 -> Note Off
		const event = await promise;
		expect(event.detail.channel).toBe(0);
		expect(event.detail.note).toBe(60);
		expect(event.detail.deviceId).toBe('fake-2');
		expect(event.detail.deviceName).toBe('Fake MIDI Input 2');
		midi.destroy();
	});

	test('Note Off command dispatches midiNoteOff', async () => {
		const env = recreateEnv([{ id: 'fake-3', name: 'Fake MIDI Input 3' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;
		const promise = waitForEvent(appState, 'midiNoteOff');
		const fakeInput = env.getInputById('fake-3');
		dispatchMidiMessage(fakeInput, [0x80, 60, 127]); // Note Off command
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
		const midi = new Midi({ storage: createMemoryStorage() });
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
			dispatchMidiMessage(fakeInput, testCase.data);
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
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		// MIDI connection is set during construction - check state directly
		expect(appState.midiConnected).toBe(true);

		// The device should be present
		expect(midi.getConnectedDevices()).toEqual([{ id: 'fake-5', name: 'Fake MIDI Input 5', enabled: true }]);

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
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		// Initially no devices
		expect(appState.midiConnected).toBe(false);
		expect(midi.getConnectedDevices()).toEqual([]);

		// Connect a new input dynamically and verify state updates
		env.connectInput('hotplug-1');
		expect(midi.getConnectedDevices()).toEqual([{ id: 'hotplug-1', name: 'hotplug-1', enabled: true }]);
		expect(appState.midiConnected).toBe(true);

		// Disconnect it
		env.disconnectInput('hotplug-1');
		expect(midi.getConnectedDevices()).toEqual([]);
		expect(appState.midiConnected).toBe(false);

		midi.destroy();
	});

	test('Control Change dispatches midiControlChange', async () => {
		const env = recreateEnv([{ id: 'fake-cc', name: 'Fake MIDI CC' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		const ccSpy = vi.spyOn(appState, 'dispatchMIDIControlChange');
		const fakeInput = env.getInputById('fake-cc');
		// 0xB4 = CC on channel 4 (mixer), controller 1, value 64
		dispatchMidiMessage(fakeInput, [0xb4, 1, 64]);

		expect(ccSpy).toHaveBeenCalledWith(4, 1, 64, { deviceId: 'fake-cc', deviceName: 'Fake MIDI CC' });
		ccSpy.mockRestore();
		midi.destroy();
	});

	test('System Real-Time messages dispatch clock/start/continue/stop', async () => {
		const env = recreateEnv([{ id: 'fake-rt', name: 'Fake MIDI RealTime' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		const clockSpy = vi.spyOn(appState, 'dispatchMIDIClock');
		const startSpy = vi.spyOn(appState, 'dispatchMIDIStart');
		const continueSpy = vi.spyOn(appState, 'dispatchMIDIContinue');
		const stopSpy = vi.spyOn(appState, 'dispatchMIDIStop');
		const fakeInput = env.getInputById('fake-rt');

		dispatchMidiMessage(fakeInput, [0xf8]);
		dispatchMidiMessage(fakeInput, [0xfa]);
		dispatchMidiMessage(fakeInput, [0xfb]);
		dispatchMidiMessage(fakeInput, [0xfc]);

		expect(clockSpy).toHaveBeenCalledTimes(1);
		expect(typeof clockSpy.mock.calls[0][0]).toBe('number');
		expect(startSpy).toHaveBeenCalledTimes(1);
		expect(continueSpy).toHaveBeenCalledTimes(1);
		expect(stopSpy).toHaveBeenCalledTimes(1);

		clockSpy.mockRestore();
		startSpy.mockRestore();
		continueSpy.mockRestore();
		stopSpy.mockRestore();
		midi.destroy();
	});

	test('Note On on projectSelection channel dispatches project selection', async () => {
		const env = recreateEnv([{ id: 'fake-proj', name: 'Fake MIDI Project' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: settings } = await import('../src/js/core/settings.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		const projectSpy = vi.spyOn(appState, 'dispatchProjectSelection');
		const noteOnSpy = vi.spyOn(appState, 'dispatchMIDINoteOn');
		const channel = settings.channelMapping.projectSelection;
		const fakeInput = env.getInputById('fake-proj');
		// Note On on project selection channel, note 2, velocity 100
		dispatchMidiMessage(fakeInput, [0x90 | channel, 2, 100]);

		expect(projectSpy).toHaveBeenCalledWith(2);
		expect(noteOnSpy).not.toHaveBeenCalled();

		projectSpy.mockRestore();
		noteOnSpy.mockRestore();
		midi.destroy();
	});

	test('requestMIDIAccess rejection sets midiConnected false and dispatches error', async () => {
		const env = recreateEnv([]);
		env.requestMIDIAccessMock.mockRejectedValue(new Error('Permission denied'));

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');

		const errorSpy = vi.spyOn(appState, 'showError');
		const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		expect(appState.midiConnected).toBe(false);
		expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('MIDI access failed: Permission denied'));

		errorSpy.mockRestore();
		consoleErrorSpy.mockRestore();
		midi.destroy();
	});

	test('uses injected appState and settings for message limits', async () => {
		const env = recreateEnv([{ id: 'inj-1', name: 'Injected MIDI' }]);

		vi.resetModules();
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const { default: defaultSettings } = await import('../src/js/core/settings.js');

		const dispatchMIDINoteOn = vi.fn();
		const fakeAppState = {
			midiConnected: false,
			error: vi.fn(),
			dispatchMIDINoteOn,
			dispatchMIDINoteOff: vi.fn(),
			dispatchMIDIControlChange: vi.fn(),
			dispatchMIDIClock: vi.fn(),
			dispatchMIDIStart: vi.fn(),
			dispatchMIDIContinue: vi.fn(),
			dispatchMIDIStop: vi.fn(),
			dispatchProjectSelection: vi.fn(),
			dispatchMIDIDevicesChanged: vi.fn()
		};
		const injectedSettings = {
			...defaultSettings,
			midi: { ...defaultSettings.midi, maxMessageLength: 2 },
			channelMapping: { ...defaultSettings.channelMapping }
		};

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const midi = new Midi({ appState: fakeAppState, settings: injectedSettings, storage: createMemoryStorage() });
		await midi.ready;

		const fakeInput = env.getInputById('inj-1');
		dispatchMidiMessage(fakeInput, [0x90, 60, 127]);

		expect(dispatchMIDINoteOn).not.toHaveBeenCalled();
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds maximum 2'));

		warnSpy.mockRestore();
		midi.destroy();
	});

	test('max MIDI device limit rejects connections beyond the cap and reads from injected settings', async () => {
		recreateEnv([]);

		vi.resetModules();
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const { default: defaultSettings } = await import('../src/js/core/settings.js');

		const fakeAppState = {
			midiConnected: false,
			error: vi.fn(),
			dispatchMIDINoteOn: vi.fn(),
			dispatchMIDINoteOff: vi.fn(),
			dispatchMIDIControlChange: vi.fn(),
			dispatchMIDIClock: vi.fn(),
			dispatchMIDIStart: vi.fn(),
			dispatchMIDIContinue: vi.fn(),
			dispatchMIDIStop: vi.fn(),
			dispatchProjectSelection: vi.fn(),
			dispatchMIDIDevicesChanged: vi.fn()
		};
		const injectedSettings = {
			...defaultSettings,
			midi: { ...defaultSettings.midi, maxMidiDevices: 2 },
			channelMapping: { ...defaultSettings.channelMapping }
		};

		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
		const env = getEnv();
		const midi = new Midi({ appState: fakeAppState, settings: injectedSettings, storage: createMemoryStorage() });
		await midi.ready;

		env.connectInput('dev-1');
		env.connectInput('dev-2');
		env.connectInput('dev-3');

		expect(midi.getConnectedDevices()).toEqual([
			{ id: 'dev-1', name: 'dev-1', enabled: true },
			{ id: 'dev-2', name: 'dev-2', enabled: true }
		]);
		expect(fakeAppState.midiConnected).toBe(true);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('maximum MIDI device limit (2) reached'));

		warnSpy.mockRestore();
		midi.destroy();
	});

	test('invalid byte validation rejects non-number, negative, >255, and non-integer bytes', async () => {
		const env = recreateEnv([{ id: 'fake-bytes', name: 'Fake MIDI Bytes' }]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		const noteOnSpy = vi.spyOn(appState, 'dispatchMIDINoteOn');
		const noteOffSpy = vi.spyOn(appState, 'dispatchMIDINoteOff');
		const ccSpy = vi.spyOn(appState, 'dispatchMIDIControlChange');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const fakeInput = env.getInputById('fake-bytes');

		// Plain Array (not Uint8Array) so invalid byte values survive indexing.
		// Uint8Array clamps to 0-255 integers by construction, making this guard
		// unreachable through normal Web MIDI messages — tested here as defense-in-depth.
		const invalidCases = [
			[0x90, 'not-a-number', 127],
			[0x90, -1, 127],
			[0x90, 256, 127],
			[0x90, 60.5, 127]
		];

		for (const data of invalidCases) {
			invokeListeners(fakeInput, 'midimessage', { data, target: fakeInput });
		}

		expect(warnSpy).toHaveBeenCalledTimes(invalidCases.length);
		expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('invalid byte at index 1'));
		expect(noteOnSpy).not.toHaveBeenCalled();
		expect(noteOffSpy).not.toHaveBeenCalled();
		expect(ccSpy).not.toHaveBeenCalled();

		noteOnSpy.mockRestore();
		noteOffSpy.mockRestore();
		ccSpy.mockRestore();
		warnSpy.mockRestore();
		midi.destroy();
	});

	test('WebMIDI unsupported path: ready resolves, no devices, midiConnected false, destroy safe', async () => {
		recreateEnv([]);

		// Simulate a browser without Web MIDI support.
		const savedRequestMIDIAccess = globalThis.navigator.requestMIDIAccess;
		globalThis.navigator.requestMIDIAccess = undefined;

		try {
			vi.resetModules();
			const { default: appState } = await import('../src/js/core/AppState.js');
			const { default: Midi } = await import('../src/js/midi-input/Midi.js');

			const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

			let midi;
			expect(() => {
				midi = new Midi({ storage: createMemoryStorage() });
			}).not.toThrow();

			await expect(midi.ready).resolves.toBeUndefined();
			expect(midi.getConnectedDevices()).toEqual([]);
			expect(appState.midiConnected).toBe(false);

			expect(() => midi.destroy()).not.toThrow();
			expect(midi.getConnectedDevices()).toEqual([]);
			expect(appState.midiConnected).toBe(false);

			logSpy.mockRestore();
		} finally {
			globalThis.navigator.requestMIDIAccess = savedRequestMIDIAccess;
		}
	});

	test('getConnectedDevices name fallback: undefined name falls back to id, then to "unknown"', async () => {
		recreateEnv([]);

		vi.resetModules();
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');

		const fakeAppState = {
			midiConnected: false,
			error: vi.fn(),
			dispatchMIDINoteOn: vi.fn(),
			dispatchMIDINoteOff: vi.fn(),
			dispatchMIDIControlChange: vi.fn(),
			dispatchMIDIClock: vi.fn(),
			dispatchMIDIStart: vi.fn(),
			dispatchMIDIContinue: vi.fn(),
			dispatchMIDIStop: vi.fn(),
			dispatchProjectSelection: vi.fn(),
			dispatchMIDIDevicesChanged: vi.fn()
		};
		const midi = new Midi({ appState: fakeAppState, storage: createMemoryStorage() });
		await midi.ready;

		const env = getEnv();

		// Device with name undefined but id set → falls back to id.
		env.triggerStateChange({ id: 'no-name-device', name: undefined, type: 'input', state: 'connected' });
		// Device with both name and id undefined → falls back to 'unknown'.
		env.triggerStateChange({ id: undefined, name: undefined, type: 'input', state: 'connected' });

		const devices = midi.getConnectedDevices();
		expect(devices).toContainEqual({ id: 'no-name-device', name: 'no-name-device', enabled: true });
		expect(devices).toContainEqual({ id: 'unknown', name: 'unknown', enabled: true });
		expect(devices).toHaveLength(2);

		midi.destroy();
	});

	test('setDeviceEnabled filters muted device messages via message.target.id', async () => {
		const env = recreateEnv([
			{ id: 'keep-on', name: 'Keep On' },
			{ id: 'mute-me', name: 'Mute Me' }
		]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const storage = createMemoryStorage();
		const midi = new Midi({ storage });
		await midi.ready;

		const noteOnSpy = vi.spyOn(appState, 'dispatchMIDINoteOn');
		midi.setDeviceEnabled('mute-me', false);

		expect(midi.getConnectedDevices()).toEqual([
			{ id: 'keep-on', name: 'Keep On', enabled: true },
			{ id: 'mute-me', name: 'Mute Me', enabled: false }
		]);
		expect(JSON.parse(storage.getItem(UNCHECKED_DEVICES_STORAGE_KEY))).toEqual(['mute-me']);

		dispatchMidiMessage(env.getInputById('mute-me'), [0x90, 60, 100]);
		expect(noteOnSpy).not.toHaveBeenCalled();

		dispatchMidiMessage(env.getInputById('keep-on'), [0x90, 61, 110]);
		expect(noteOnSpy).toHaveBeenCalledWith(0, 61, 110, { deviceId: 'keep-on', deviceName: 'Keep On' });

		midi.setDeviceEnabled('mute-me', true);
		dispatchMidiMessage(env.getInputById('mute-me'), [0x90, 62, 120]);
		expect(noteOnSpy).toHaveBeenCalledWith(0, 62, 120, { deviceId: 'mute-me', deviceName: 'Mute Me' });
		expect(JSON.parse(storage.getItem(UNCHECKED_DEVICES_STORAGE_KEY))).toEqual([]);

		noteOnSpy.mockRestore();
		midi.destroy();
	});

	test('persistence fail-open: missing, empty, invalid, or unmatched unchecked ids enable all', async () => {
		const env = recreateEnv([{ id: 'live-1', name: 'Live One' }]);

		vi.resetModules();
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

		const missingStorageMidi = new Midi({ storage: createMemoryStorage() });
		await missingStorageMidi.ready;
		expect(missingStorageMidi.getConnectedDevices()[0].enabled).toBe(true);
		missingStorageMidi.destroy();

		const emptyStorageMidi = new Midi({
			storage: createMemoryStorage({ [UNCHECKED_DEVICES_STORAGE_KEY]: '[]' })
		});
		await emptyStorageMidi.ready;
		expect(emptyStorageMidi.getConnectedDevices()[0].enabled).toBe(true);
		emptyStorageMidi.destroy();

		const invalidStorageMidi = new Midi({
			storage: createMemoryStorage({ [UNCHECKED_DEVICES_STORAGE_KEY]: '{not-json' })
		});
		await invalidStorageMidi.ready;
		expect(invalidStorageMidi.getConnectedDevices()[0].enabled).toBe(true);
		invalidStorageMidi.destroy();

		const staleIdsMidi = new Midi({
			storage: createMemoryStorage({ [UNCHECKED_DEVICES_STORAGE_KEY]: JSON.stringify(['gone-device']) })
		});
		await staleIdsMidi.ready;
		expect(staleIdsMidi.getConnectedDevices()).toEqual([{ id: 'live-1', name: 'Live One', enabled: true }]);
		staleIdsMidi.destroy();

		const matchedMuteMidi = new Midi({
			storage: createMemoryStorage({ [UNCHECKED_DEVICES_STORAGE_KEY]: JSON.stringify(['live-1']) })
		});
		await matchedMuteMidi.ready;
		expect(matchedMuteMidi.getConnectedDevices()).toEqual([{ id: 'live-1', name: 'Live One', enabled: false }]);

		const { default: appState } = await import('../src/js/core/AppState.js');
		const spy = vi.spyOn(appState, 'dispatchMIDINoteOn');
		dispatchMidiMessage(env.getInputById('live-1'), [0x90, 60, 100]);
		expect(spy).not.toHaveBeenCalled();
		spy.mockRestore();
		matchedMuteMidi.destroy();
		warnSpy.mockRestore();
	});

	test('hot-plug dispatches midiDevicesChanged with id/name/enabled', async () => {
		const env = recreateEnv([]);

		vi.resetModules();
		const { default: appState } = await import('../src/js/core/AppState.js');
		const { default: Midi } = await import('../src/js/midi-input/Midi.js');
		const midi = new Midi({ storage: createMemoryStorage() });
		await midi.ready;

		const devicesSpy = vi.fn();
		appState.subscribe('midiDevicesChanged', devicesSpy);

		env.connectInput('plug-a');
		expect(devicesSpy).toHaveBeenCalled();
		const lastDetail = devicesSpy.mock.calls.at(-1)[0].detail;
		expect(lastDetail.devices).toEqual([{ id: 'plug-a', name: 'plug-a', enabled: true }]);

		midi.setDeviceEnabled('plug-a', false);
		expect(devicesSpy.mock.calls.at(-1)[0].detail.devices).toEqual([{ id: 'plug-a', name: 'plug-a', enabled: false }]);

		midi.destroy();
	});
});
