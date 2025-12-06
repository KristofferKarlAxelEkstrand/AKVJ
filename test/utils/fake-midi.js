import { vi } from 'vitest';

/**
 * Factories for fake MIDI inputs and access objects used in tests.
 * These simulate EventTarget-like addEventListener/removeEventListener behavior
 * by storing handlers in a private `_listeners` Map which tests can inspect or
 * invoke using the helpers from `invoke-listeners.js`.
 */

export function createFakeInput({ id = 'fake-1', name = 'Fake MIDI Input' } = {}) {
	return {
		id,
		name,
		_listeners: new Map(),
		addEventListener(type, fn) {
			const arr = this._listeners.get(type) ?? [];
			arr.push(fn);
			this._listeners.set(type, arr);
		},
		removeEventListener(type, fn) {
			const arr = this._listeners.get(type) ?? [];
			this._listeners.set(
				type,
				arr.filter(h => h !== fn)
			);
		}
	};
}

export function createFakeAccess(inputs = []) {
	const inputMap = new Map(inputs.map(i => [i.id, i]));
	return {
		inputs: inputMap,
		_listeners: new Map(),
		addEventListener(type, handler) {
			const arr = this._listeners.get(type) ?? [];
			arr.push(handler);
			this._listeners.set(type, arr);
		},
		removeEventListener(type, handler) {
			const arr = this._listeners.get(type) ?? [];
			this._listeners.set(
				type,
				arr.filter(h => h !== handler)
			);
		}
	};
}

/**
 * Create a fake MIDI environment for tests. Returns a small helper object
 * containing `inputs`, `access`, `requestMIDIAccessMock`, and a `teardown`
 * function to restore `navigator.requestMIDIAccess` and clear any test state.
 *
 * Example usage:
 * const env = createFakeMIDIEnvironment([{ id: 'i1', name: 'Fake 1' }]);
 * // env.requestMIDIAccessMock is a vi.fn() returning env.access
 * // env.inputs[0] is the fake input
 */

export function createFakeMIDIEnvironment(inputDefinitions = [{ id: 'fake', name: 'Fake' }]) {
	const inputs = inputDefinitions.map(d => createFakeInput(d));
	const access = createFakeAccess(inputs);
	const requestMIDIAccessMock = vi.fn().mockResolvedValue(access);

	// NOTE: We no longer set or restore `navigator.requestMIDIAccess` here.
	// Tests should use the fixture `useFakeMIDIFixture()` which sets the
	// global in a beforeEach and restores in an afterEach.

	return {
		inputs,
		access,
		requestMIDIAccessMock,
		/**
		 * Return a fake input by its id (null if not found).
		 */
		getInputById(id) {
			return access.inputs.get(id) ?? inputs.find(i => i.id === id) ?? null;
		},
		/**
		 * Connect an input by id (adds the input to access and fires a 'statechange' event)
		 * Returns the `port` object passed to the statechange handlers.
		 */
		connectInput(id) {
			let input = inputs.find(i => i.id === id);
			if (!input) {
				input = createFakeInput({ id, name: id });
				inputs.push(input);
			}
			access.inputs.set(input.id, input);
			const port = { ...input, type: 'input', state: 'connected' };
			(access._listeners.get('statechange') ?? []).forEach(h => {
				try {
					h({ port });
				} catch {
					/* tests should handle errors */
				}
			});
			return port;
		},
		/**
		 * Disconnect an input by id (removes the input from access or sets state, then fires statechange)
		 */
		disconnectInput(id) {
			const input = inputs.find(i => i.id === id);
			if (!input) {
				return null;
			}
			const port = { ...input, type: 'input', state: 'disconnected' };
			access.inputs.delete(id);
			(access._listeners.get('statechange') ?? []).forEach(h => {
				try {
					h({ port });
				} catch {
					/* tests should handle errors */
				}
			});
			return port;
		},
		/**
		 * Trigger a raw statechange event with a custom port object.
		 */
		triggerStateChange(port) {
			(access._listeners.get('statechange') ?? []).forEach(h => {
				try {
					h({ port });
				} catch {
					/* tests should handle errors */
				}
			});
		},
		/**
		 * No-op kept for API compatibility with useFakeMIDIFixture.
		 * Global navigator cleanup is handled by the fixture.
		 */
		teardown() {}
	};
}
