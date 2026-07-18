/**
 * Whole-pixel coordinate snap for canvas draws (engine-wide rule).
 * @param {number} value
 * @returns {number}
 */
export function snapToPixel(value) {
	return Math.floor(value);
}

export default snapToPixel;
