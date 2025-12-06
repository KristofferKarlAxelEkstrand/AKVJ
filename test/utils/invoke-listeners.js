/**
 * Test helper for invoking and inspecting listeners on fake EventTarget-like objects
 * The test suite uses fake objects that store listeners in a private `_listeners` Map.
 */
export function getListeners(target, eventName) {
	if (!target || !target._listeners) {
		return [];
	}
	return target._listeners.get(eventName) ?? [];
}

export function invokeListeners(target, eventName, eventOrArgs) {
	const handlers = getListeners(target, eventName);
	// Support passing either a single event object or an array of args
	const args = Array.isArray(eventOrArgs) ? eventOrArgs : [eventOrArgs];
	handlers.forEach(h => {
		try {
			h(...args);
		} catch (err) {
			// Tests should fail if handler throws: log error for debugging, then re-throw
			console.error('Error invoking listener', err);
			throw err;
		}
	});
	return handlers;
}
