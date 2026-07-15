import settings from '../../src/js/core/settings.js';

/**
 * Temporarily patch top-level settings keys and restore them afterwards.
 *
 * @param {Object} patches - Object where keys are top-level settings keys and values are objects to merge into that key
 * @param {Function} fn - Callback that runs while the patched values are active
 * @returns {*} The return value of fn (or its resolved value if async)
 */
export default function withSettings(patches, fn) {
	const originals = {};
	for (const key of Object.keys(patches)) {
		originals[key] = { ...settings[key] };
		settings[key] = { ...settings[key], ...patches[key] };
	}

	function restore() {
		for (const key of Object.keys(patches)) {
			settings[key] = originals[key];
		}
	}

	try {
		const result = fn();
		if (result instanceof Promise) {
			return result.finally(restore);
		}
		return result;
	} catch (error) {
		restore();
		throw error;
	}
}
