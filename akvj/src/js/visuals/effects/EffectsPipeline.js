import effectRegistry from './index.js';

/**
 * EffectsPipeline - Applies registered visual effects to a canvas context.
 *
 * Each effect module implements:
 *   apply(imageData, effect, timestamp, effectContext) => boolean
 *
 * effectContext contains: width, height, effectParams, effectRanges, bpm, scratchBuffer,
 * secondaryScratchBuffer
 *
 * Scratch buffer ownership contract:
 * - The pipeline owns both scratch buffers (Uint8ClampedArray) and allocates them once,
 *   reusing them across frames and effects. Effects must never allocate per frame — that
 *   is garbage in the 60fps render loop.
 * - They are passed to each effect via effectContext.scratchBuffer and
 *   effectContext.secondaryScratchBuffer. Use the secondary one only when an effect needs
 *   two working buffers at once (e.g., grayscale blend: original + modified).
 * - Effects may read from and write to both buffers during their apply() call,
 *   but must NOT retain references to them after returning.
 * - Both buffers are shared across all effects in a single frame, and their contents are
 *   undefined on entry. An effect that needs a pristine copy of the input pixels must copy
 *   from imageData.data into a buffer before reading from it (e.g., glitch, offset, split).
 * - The pipeline guarantees both buffers are at least as large as imageData.data.
 */
const FALLBACK_BPM_MIN = 1;
const FALLBACK_BPM = 120;

class EffectsPipeline {
	/** @type {Uint8ClampedArray|null} */
	#scratchBuffer = null;

	/** @type {Uint8ClampedArray|null} Second working buffer for effects that need two */
	#secondaryScratchBuffer = null;

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
			bpmMin: FALLBACK_BPM_MIN,
			bpmDefault: FALLBACK_BPM,
			scratchBuffer: null,
			secondaryScratchBuffer: null
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
		if (!this.#effectContext) {
			return;
		}
		if (!activeEffects || activeEffects.length === 0) {
			return;
		}

		const { width, height, bpm, bpmMin = FALLBACK_BPM_MIN, bpmDefault = FALLBACK_BPM } = renderContext;
		const imageData = ctx.getImageData(0, 0, width, height);
		this.#ensureScratchBuffers(imageData.data.length);
		this.#prepareEffectContext(width, height, bpm, bpmMin, bpmDefault);

		const isModified = this.#applyEffects(activeEffects, imageData, timestamp);
		if (isModified) {
			ctx.putImageData(imageData, 0, 0);
		}
	}

	#ensureScratchBuffers(pixelsLength) {
		if (!this.#scratchBuffer || this.#scratchBuffer.length < pixelsLength) {
			this.#scratchBuffer = new Uint8ClampedArray(pixelsLength);
		}
		if (!this.#secondaryScratchBuffer || this.#secondaryScratchBuffer.length < pixelsLength) {
			this.#secondaryScratchBuffer = new Uint8ClampedArray(pixelsLength);
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
		effectContext.secondaryScratchBuffer = this.#secondaryScratchBuffer;
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
			this.#secondaryScratchBuffer = null;
		} catch (error) {
			console.error('Error releasing scratch buffers in EffectsPipeline:', error);
		}
		try {
			this.#effectContext = null;
		} catch (error) {
			console.error('Error releasing effectContext in EffectsPipeline:', error);
		}
	}
}

export default EffectsPipeline;
