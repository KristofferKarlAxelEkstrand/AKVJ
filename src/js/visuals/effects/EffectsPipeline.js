import effectRegistry from './index.js';

/**
 * EffectsPipeline - Applies registered visual effects to a canvas context.
 *
 * Each effect module implements:
 *   apply(imageData, effect, timestamp, effectContext) => boolean
 *
 * effectContext contains: width, height, effectParams, effectRanges, bpm, scratchBuffer
 */
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
			bpmMin: 1,
			bpmDefault: 120,
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

		const { width, height, bpm, bpmMin = 1, bpmDefault = 120 } = renderContext;
		const imageData = ctx.getImageData(0, 0, width, height);
		const dataLength = imageData.data.length;

		if (!this.#scratchBuffer || this.#scratchBuffer.length < dataLength) {
			this.#scratchBuffer = new Uint8ClampedArray(dataLength);
		}

		const effectContext = this.#effectContext;
		effectContext.width = width;
		effectContext.height = height;
		effectContext.bpm = bpm;
		effectContext.bpmMin = bpmMin;
		effectContext.bpmDefault = bpmDefault;
		effectContext.scratchBuffer = this.#scratchBuffer;

		let modified = false;
		for (const effect of activeEffects) {
			const effectModule = effectRegistry[effect.type];
			if (!effectModule || (effectModule.requiresNote && typeof effect.note !== 'number')) {
				continue;
			}
			modified = effectModule.apply(imageData, effect, timestamp, effectContext) || modified;
		}

		if (modified) {
			ctx.putImageData(imageData, 0, 0);
		}
	}
}

export default EffectsPipeline;
