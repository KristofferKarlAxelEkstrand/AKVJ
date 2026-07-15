import { vi } from 'vitest';

/**
 * Factories for fake MIDI inputs and access objects used in tests.
 * These simulate EventTarget-like addEventListener/removeEventListener behavior
 * by storing handlers in a closure-private Map which tests can inspect or
 * invoke using the helpers from `invokeListeners.js`.
 */

export function createFakeInput({ id = 'fake-1', name = 'Fake MIDI Input' } = {}) {
	const listenersByType = new Map();
	return {
		id,
		name,
		getListeners(eventName) {
			return listenersByType.get(eventName) ?? [];
		},
		addEventListener(type, listener) {
			const handlers = listenersByType.get(type) ?? [];
			handlers.push(listener);
			listenersByType.set(type, handlers);
		},
		removeEventListener(type, listener) {
			const handlers = listenersByType.get(type) ?? [];
			listenersByType.set(
				type,
				handlers.filter(handler => handler !== listener)
			);
		}
	};
}

export function createFakeAccess(inputs = []) {
	const inputMap = new Map(inputs.map(input => [input.id, input]));
	const listenersByType = new Map();
	return {
		inputs: inputMap,
		getListeners(eventName) {
			return listenersByType.get(eventName) ?? [];
		},
		addEventListener(type, handler) {
			const handlers = listenersByType.get(type) ?? [];
			handlers.push(handler);
			listenersByType.set(type, handlers);
		},
		removeEventListener(type, handler) {
			const handlers = listenersByType.get(type) ?? [];
			listenersByType.set(
				type,
				handlers.filter(existingHandler => existingHandler !== handler)
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
	const inputs = inputDefinitions.map(definition => createFakeInput(definition));
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
			return access.inputs.get(id) ?? inputs.find(input => input.id === id) ?? null;
		},
		/**
		 * Connect an input by id (adds the input to access and fires a 'statechange' event)
		 * Returns the `port` object passed to the statechange handlers.
		 */
		connectInput(id) {
			const existingInput = inputs.find(input => input.id === id);
			const input = existingInput ?? createFakeInput({ id, name: id });
			if (!existingInput) {
				inputs.push(input);
			}
			access.inputs.set(input.id, input);
			const port = { ...input, type: 'input', state: 'connected' };
			access.getListeners('statechange').forEach(handler => {
				try {
					handler({ port });
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
			const input = inputs.find(existingInput => existingInput.id === id);
			if (!input) {
				return null;
			}
			const port = { ...input, type: 'input', state: 'disconnected' };
			access.inputs.delete(id);
			access.getListeners('statechange').forEach(handler => {
				try {
					handler({ port });
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
			access.getListeners('statechange').forEach(handler => {
				try {
					handler({ port });
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
