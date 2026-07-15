/**
 * Test helper for invoking and inspecting listeners on fake EventTarget-like objects.
 * Fake objects expose a `getListeners(eventName)` method that returns stored handlers.
 */
export function getListeners(target, eventName) {
	if (!target || typeof target.getListeners !== 'function') {
		return [];
	}
	return target.getListeners(eventName) ?? [];
}

export function invokeListeners(target, eventName, eventOrArgs) {
	const handlers = getListeners(target, eventName);
	const args = Array.isArray(eventOrArgs) ? eventOrArgs : [eventOrArgs];
	handlers.forEach(handler => {
		try {
			handler(...args);
		} catch (err) {
			console.error('Error invoking listener', err);
			throw err;
		}
	});
	return handlers;
}
