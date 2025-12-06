import { beforeEach, afterEach } from 'vitest';
import { createFakeMIDIEnvironment } from './fake-midi.js';

/**
 * Sets up a fake MIDI environment before each test and tears it down after.
 * Returns helpers to access or recreate the environment inside tests.
 *
 * Usage:
 * const { getEnv, recreateEnv } = useFakeMIDIFixture([{ id: 'fake-1', name: 'Fake MIDI Input' }]);
 *
 * getEnv() -> returns the current environment instance
 * recreateEnv(inputDefinitions) -> replaces the current env with a new one built from inputDefinitions
 */
export function useFakeMIDIFixture(defaultInputDefinitions = [{ id: 'fake-1', name: 'Fake MIDI Input' }]) {
	let env = null;

	const setupEnv = inputDefinitions => {
		if (env && typeof env.teardown === 'function') {
			env.teardown();
		}
		env = createFakeMIDIEnvironment(inputDefinitions);
		const original = globalThis.navigator?.requestMIDIAccess;
		env._originalRequestMIDIAccess = original;
		if (!globalThis.navigator) {
			globalThis.navigator = {};
		}
		globalThis.navigator.requestMIDIAccess = env.requestMIDIAccessMock;
		return env;
	};

	beforeEach(() => {
		setupEnv(defaultInputDefinitions);
	});
	afterEach(async () => {
		// If the midi module was imported by the test, destroy it to clean listeners
		try {
			const midiModule = await import('../../src/js/midi.js');
			if (midiModule?.default && typeof midiModule.default.destroy === 'function') {
				midiModule.default.destroy();
			}
		} catch {
			// ignore errors if the module was never imported in the test
		}
		// Restore global to original state
		const original = env && env._originalRequestMIDIAccess;
		if (original === undefined) {
			if (globalThis.navigator) {
				delete globalThis.navigator.requestMIDIAccess;
			}
		} else if (globalThis.navigator) {
			globalThis.navigator.requestMIDIAccess = original;
		}
		if (env && typeof env.teardown === 'function') {
			env.teardown();
		}
		env = null;
	});

	const getEnv = () => env;
	const recreateEnv = inputDefinitions => setupEnv(inputDefinitions);

	return { getEnv, recreateEnv };
}
