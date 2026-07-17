import effectRegistry from './index.js';

/**
 * EffectsPipeline - Applies registered visual effects to a canvas context.
 *
 * Each effect module implements:
 *   apply(imageData, effect, timestamp, effectContext) => boolean
 *
 * effectContext contains: width, height, effectParams, effectRanges, bpm, scratchBuffer
 *
 * Scratch buffer ownership contract:
 * - The pipeline owns the scratch buffer (a Uint8ClampedArray) and allocates it once,
 *   reusing it across frames and effects.
 * - The scratch buffer is passed to each effect via effectContext.scratchBuffer.
 * - Effects may read from and write to the scratch buffer during their apply() call,
 *   but must NOT retain references to it after returning.
 * - The scratch buffer is shared across all effects in a single frame. An effect that
 *   needs a pristine copy of the input pixels should copy from imageData.data into the
 *   scratch buffer before reading from it (e.g., glitch, offset, split effects).
 * - The pipeline guarantees the scratch buffer is at least as large as imageData.data.
 */
const DEFAULT_BPM_MIN = 1;
const DEFAULT_BPM = 120;

class EffectsPipeline {
	/** @type {Uint8ClampedArray|null} */
	#scratchBuffer = null;

	/** @type {Object} Reused across apply() calls to avoid per-frame allocation */
	#effectContext;

	/**
	 * @param {Object} effectParams - Effect parameters from settings
	 * @param {Object} effectRanges - Effect note ranges from settings
	 */
	constructor(effectParams, effectRanges) {
		this.#effectContext = {
			width: 0,
			height: 0,
			effectParams,
			effectRanges,
			bpm: 0,
			bpmMin: DEFAULT_BPM_MIN,
			bpmDefault: DEFAULT_BPM,
			scratchBuffer: null
		};
	}

	/**
	 * Apply active effects to the provided canvas context.
	 * @param {CanvasRenderingContext2D} ctx - Target canvas context
	 * @param {Array<{type: string, note: number, velocity: number}>} activeEffects
	 * @param {number} timestamp - RAF timestamp
	 * @param {{width: number, height: number, bpm: number, bpmMin?: number, bpmDefault?: number}} renderContext
	 */
	apply(ctx, activeEffects, timestamp, renderContext) {
		if (!activeEffects || activeEffects.length === 0) {
			return;
		}

		const { width, height, bpm, bpmMin = DEFAULT_BPM_MIN, bpmDefault = DEFAULT_BPM } = renderContext;
		const imageData = ctx.getImageData(0, 0, width, height);
		this.#ensureScratchBuffer(imageData.data.length);
		this.#prepareEffectContext(width, height, bpm, bpmMin, bpmDefault);

		const isModified = this.#applyEffects(activeEffects, imageData, timestamp);
		if (isModified) {
			ctx.putImageData(imageData, 0, 0);
		}
	}

	#ensureScratchBuffer(pixelsLength) {
		if (!this.#scratchBuffer || this.#scratchBuffer.length < pixelsLength) {
			this.#scratchBuffer = new Uint8ClampedArray(pixelsLength);
		}
	}

	#prepareEffectContext(width, height, bpm, bpmMin, bpmDefault) {
		const effectContext = this.#effectContext;
		effectContext.width = width;
		effectContext.height = height;
		effectContext.bpm = bpm;
		effectContext.bpmMin = bpmMin;
		effectContext.bpmDefault = bpmDefault;
		effectContext.scratchBuffer = this.#scratchBuffer;
	}

	#applyEffects(activeEffects, imageData, timestamp) {
		let isModified = false;
		for (const effect of activeEffects) {
			const effectModule = effectRegistry[effect.type];
			if (!effectModule || (effectModule.requiresNote && typeof effect.note !== 'number')) {
				continue;
			}
			isModified = effectModule.apply(imageData, effect, timestamp, this.#effectContext) || isModified;
		}
		return isModified;
	}

	/**
	 * Release allocated resources for garbage collection.
	 */
	destroy() {
		try {
			this.#scratchBuffer = null;
		} catch (error) {
			console.error('Error releasing scratchBuffer in EffectsPipeline:', error);
		}
		try {
			this.#effectContext = null;
		} catch (error) {
			console.error('Error releasing effectContext in EffectsPipeline:', error);
		}
	}
}

export default EffectsPipeline;
