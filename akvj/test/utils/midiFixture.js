import { beforeEach, afterEach } from 'vitest';
import { createFakeMIDIEnvironment } from './fakeMidi.js';

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

	let originalRequestMIDIAccess;

	const setupEnv = inputDefinitions => {
		if (env && typeof env.teardown === 'function') {
			env.teardown();
		}
		env = createFakeMIDIEnvironment(inputDefinitions);
		originalRequestMIDIAccess = globalThis.navigator?.requestMIDIAccess;
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
		// Tests that instantiate Midi are responsible for calling destroy() themselves.
		// Restore global to original state
		if (originalRequestMIDIAccess === undefined) {
			if (globalThis.navigator) {
				delete globalThis.navigator.requestMIDIAccess;
			}
		} else if (globalThis.navigator) {
			globalThis.navigator.requestMIDIAccess = originalRequestMIDIAccess;
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
