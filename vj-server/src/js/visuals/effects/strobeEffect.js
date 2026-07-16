/**
 * Strobe effect: flash white at BPM-synced subdivisions based on velocity.
 */
import { RGBA_CHANNEL_COUNT } from './effectConstants.js';

const WHITE_PIXEL_VALUE = 255;
const STROBE_WHITEOUT_MAX_VELOCITY = 9;
const STROBE_PULSE_MIN_VELOCITY = 10;
const STROBE_VELOCITY_BUCKET_SIZE = 10;
const STROBE_MAX_PULSES_PER_BEAT = 12;
const STROBE_DUTY_CYCLE_BASE = 0.25;
const STROBE_DUTY_CYCLE_RANGE = 0.25;
const MS_PER_MINUTE = 60000;

export default {
	/**
	 * @param {ImageData} imageData
	 * @param {{velocity: number}} effect
	 * @param {number} timestamp
	 * @param {{bpm: number, bpmMin: number, bpmDefault: number}} effectContext
	 */
	apply(imageData, effect, timestamp, effectContext) {
		const pixels = imageData.data;
		const { velocity } = effect;

		if (!velocity) {
			return false;
		}

		if (velocity >= 1 && velocity <= STROBE_WHITEOUT_MAX_VELOCITY) {
			applyWhiteout(pixels);
			return true;
		}

		if (isStrobeActive(velocity, timestamp, effectContext)) {
			applyWhiteout(pixels);
			return true;
		}
		return false;
	},

	type: 'strobe'
};

function applyWhiteout(pixels) {
	for (let i = 0; i < pixels.length; i += RGBA_CHANNEL_COUNT) {
		pixels[i] = WHITE_PIXEL_VALUE;
		pixels[i + 1] = WHITE_PIXEL_VALUE;
		pixels[i + 2] = WHITE_PIXEL_VALUE;
	}
}

function isStrobeActive(velocity, timestamp, effectContext) {
	const pulsesPerBeat = Math.max(1, Math.min(STROBE_MAX_PULSES_PER_BEAT, Math.floor((velocity - STROBE_PULSE_MIN_VELOCITY) / STROBE_VELOCITY_BUCKET_SIZE) + 1));
	const bucketRemainder = (velocity - STROBE_PULSE_MIN_VELOCITY) % STROBE_VELOCITY_BUCKET_SIZE;
	const duty = STROBE_DUTY_CYCLE_BASE + (bucketRemainder / (STROBE_VELOCITY_BUCKET_SIZE - 1)) * STROBE_DUTY_CYCLE_RANGE;
	const bpm = Math.max(effectContext.bpmMin, effectContext.bpm ?? effectContext.bpmDefault);
	const msPerBeat = MS_PER_MINUTE / bpm;
	const effectiveTimestamp = timestamp ?? performance.now();
	const beatPos = (effectiveTimestamp % msPerBeat) / msPerBeat;
	const pulsePhase = (beatPos * pulsesPerBeat) % 1;
	return pulsePhase < duty;
}
