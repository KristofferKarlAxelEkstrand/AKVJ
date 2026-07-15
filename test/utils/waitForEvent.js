/**
 * Helper utilities for tests
 */

/**
 * Wait for an event and resolve when fired. The helper supports both
 * EventTarget-style objects (addEventListener/removeEventListener) and
 * objects that expose a `subscribe()` method that returns an unsubscribe
 * function (e.g., our AppState).
 *
 * @param {EventTarget|*} target - The object to subscribe to events on
 * @param {string} eventName - The name of the event to wait for
 * @returns {Promise<Event>} Resolves with the event when dispatched
 */
export function waitForEvent(target, eventName) {
	return new Promise((resolve, reject) => {
		if (!target) {
			reject(new Error('Target is required'));
			return;
		}

		// If the target supports `subscribe` and returns an unsubscribe function
		if (typeof target.subscribe === 'function') {
			const unsubscribe = target.subscribe(eventName, event => {
				try {
					unsubscribe();
				} catch (error) {
					console.warn('Failed to unsubscribe from event on target:', target, eventName, error);
				}
				resolve(event);
			});
			return;
		}

		// If the target supports DOM event listeners
		if (typeof target.addEventListener === 'function') {
			const handler = event => {
				try {
					target.removeEventListener(eventName, handler);
				} catch (error) {
					console.warn('Failed to remove event listener on target:', target, eventName, error);
				}
				resolve(event);
			};
			target.addEventListener(eventName, handler);
			return;
		}

		reject(new Error('Target does not support subscribe or addEventListener'));
	});
}
