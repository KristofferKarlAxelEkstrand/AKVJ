/** Shared BPM / beat timing helpers (allocation-free constants). */

export const MS_PER_MINUTE = 60000;

/**
 * @param {number} bpm
 * @returns {number} Milliseconds per beat
 */
export function msPerBeat(bpm) {
	return MS_PER_MINUTE / bpm;
}
