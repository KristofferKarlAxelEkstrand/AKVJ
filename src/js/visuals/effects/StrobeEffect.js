/**
 * Strobe effect: flash white at BPM-synced subdivisions based on velocity.
 */
export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{velocity: number}} effect
	 * @param {number} timestamp
	 * @param {{bpm: number, bpmMin: number, bpmDefault: number}} effectContext
	 */
	apply(imageData, effect, timestamp, effectContext) {
		const data = imageData.data;
		const { velocity } = effect;

		if (!velocity) {
			return false;
		}

		// White-out for very low velocities
		if (velocity >= 1 && velocity <= 9) {
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255;
				data[i + 1] = 255;
				data[i + 2] = 255;
			}
			return true;
		}

		// Map velocity to pulses per beat for velocities >= 10
		let pulsesPerBeat = Math.floor((velocity - 10) / 10) + 1;
		pulsesPerBeat = Math.max(1, Math.min(12, pulsesPerBeat));

		const bucketRemainder = (velocity - 10) % 10;
		const duty = 0.25 + (bucketRemainder / 9) * 0.25;

		const bpm = Math.max(effectContext.bpmMin, effectContext.bpm ?? effectContext.bpmDefault);
		const msPerBeat = 60000 / bpm;
		const t = timestamp ?? performance.now();
		const beatPos = (t % msPerBeat) / msPerBeat;
		const pulsePhase = (beatPos * pulsesPerBeat) % 1;

		if (pulsePhase < duty) {
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255;
				data[i + 1] = 255;
				data[i + 2] = 255;
			}
			return true;
		}
		return false;
	},

	type: 'strobe'
};
