import { RGBA_CHANNEL_COUNT, RGB_CHANNEL_COUNT } from './effects/effectConstants.js';

/**
 * Bit depth mixing constants.
 * Define how mask grayscale values (0-255) are quantized for Layer Group A and Layer Group B blending.
 */
const BIT_DEPTH_MIXING = {
	/** 1-bit threshold: values below this show Layer Group A, above show Layer Group B */
	THRESHOLD_1BIT: 128,
	/** 2-bit: 256/4 = 64 per level, giving 4 levels (0-3) */
	DIVISOR_2BIT: 64,
	/** 2-bit max level value */
	MAX_LEVEL_2BIT: 3,
	/** 4-bit: 256/16 = 16 per level, giving 16 levels (0-15) */
	DIVISOR_4BIT: 16,
	/** 4-bit max level value */
	MAX_LEVEL_4BIT: 15,
	/** 8-bit: full 256 levels for smooth blending */
	MAX_LEVEL_8BIT: 255
};

/**
 * Compositor - Manages off-screen canvases and Layer Group A and Layer Group B blending.
 *
 * Responsibilities:
 * - Create and own off-screen canvases for Layer Group A, Layer Group B, Mask, and Mixed output.
 * - Clear layer group canvases each frame.
 * - Mix Layer Group A and Layer Group B using the active mask (supporting 1/2/4/8-bit masks).
 * - With no mask: draw A and/or B with source-over (A first, then B on top when both active).
 *
 * The Renderer drives the Compositor: it renders layer groups into ctxA/ctxB,
 * then asks the Compositor to produce the mixed result.
 */
class Compositor {
	/** @type {number} */
	#canvasWidth;

	/** @type {number} */
	#canvasHeight;

	/** @type {HTMLCanvasElement} */
	#canvasA;

	/** @type {CanvasRenderingContext2D} */
	#ctxA;

	/** @type {HTMLCanvasElement} */
	#canvasB;

	/** @type {CanvasRenderingContext2D} */
	#ctxB;

	/** @type {CanvasRenderingContext2D} */
	#ctxMask;

	/** @type {HTMLCanvasElement} */
	#canvasMixed;

	/** @type {CanvasRenderingContext2D} */
	#ctxMixed;

	/** @type {ImageData|null} */
	#mixedImageData = null;

	/** @type {number} */
	#pixelCount = 0;

	/** @type {{layerGroupA: Uint8ClampedArray, layerGroupB: Uint8ClampedArray, mask: Uint8ClampedArray, output: Uint8ClampedArray}} Reused every frame to avoid GC allocation */
	#pixelBuffers = { layerGroupA: null, layerGroupB: null, mask: null, output: null };

	/** @type {{ backgroundColor: string, imageSmoothingEnabled: boolean, imageSmoothingQuality: string }} */
	#renderingConfig;

	/**
	 * @param {number} width - Canvas width in pixels
	 * @param {number} height - Canvas height in pixels
	 * @param {{ backgroundColor: string, imageSmoothingEnabled: boolean, imageSmoothingQuality: string }} renderingConfig
	 */
	constructor(width, height, renderingConfig) {
		this.#canvasWidth = width;
		this.#canvasHeight = height;
		this.#renderingConfig = renderingConfig;
		this.#pixelCount = width * height;
		this.#initOffscreenCanvases();
		this.#ensurePixelBuffers();
	}

	get ctxA() {
		return this.#ctxA;
	}

	get ctxB() {
		return this.#ctxB;
	}

	get ctxMask() {
		return this.#ctxMask;
	}

	get ctxMixed() {
		return this.#ctxMixed;
	}

	get canvasMixed() {
		return this.#canvasMixed;
	}

	/**
	 * Create an off-screen canvas with the configured dimensions and settings.
	 * @param {boolean} [willReadFrequently=false] - Hint to the UA that this canvas will be read with getImageData frequently.
	 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }} The canvas and its 2D context
	 */
	#createOffscreenCanvas(willReadFrequently = false) {
		const canvas = document.createElement('canvas');
		canvas.width = this.#canvasWidth;
		canvas.height = this.#canvasHeight;
		const ctx = canvas.getContext('2d', { willReadFrequently });
		if (ctx) {
			ctx.imageSmoothingEnabled = this.#renderingConfig.imageSmoothingEnabled;
			ctx.imageSmoothingQuality = this.#renderingConfig.imageSmoothingQuality;
			ctx.fillStyle = this.#renderingConfig.backgroundColor;
		}
		return { canvas, ctx };
	}

	/**
	 * Initialize off-screen canvases for layer group compositing.
	 */
	#initOffscreenCanvases() {
		({ canvas: this.#canvasA, ctx: this.#ctxA } = this.#createOffscreenCanvas(true));
		({ canvas: this.#canvasB, ctx: this.#ctxB } = this.#createOffscreenCanvas(true));
		({ ctx: this.#ctxMask } = this.#createOffscreenCanvas(true));
		({ canvas: this.#canvasMixed, ctx: this.#ctxMixed } = this.#createOffscreenCanvas(true));
	}

	/**
	 * Clear the Layer Group A and Layer Group B off-screen canvases to the background color.
	 */
	clearLayerGroupCanvases() {
		if (!this.#ctxA || !this.#ctxB) {
			return;
		}
		this.#ctxA.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxA.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		this.#ctxB.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxB.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Mix Layer Group A and Layer Group B using the active mask.
	 * The caller (Renderer) assembles the input so the Compositor stays
	 * ignorant of layer group/mask managers and only deals in pixels.
	 * @param {Object} compositingInput
	 * @param {import('./Clip.js').default|null} compositingInput.mask - Active mask clip, or null
	 * @param {number} compositingInput.bitDepth - Mask bit depth (1, 2, 4, or 8)
	 * @param {boolean} compositingInput.isLayerGroupAEmpty - Whether Layer Group A has no active clips
	 * @param {boolean} compositingInput.isLayerGroupBEmpty - Whether Layer Group B has no active clips
	 * @param {number} timestamp - Current RAF timestamp
	 */
	mixLayerGroups({ mask, bitDepth, isLayerGroupAEmpty, isLayerGroupBEmpty }, timestamp) {
		if (!this.#ctxA || !this.#ctxB || !this.#ctxMask || !this.#ctxMixed) {
			return;
		}

		this.#fillMixedCanvasBackground();

		if (isLayerGroupAEmpty && isLayerGroupBEmpty) {
			return;
		}

		if (!mask) {
			this.#drawUnmaskedLayerGroups(isLayerGroupAEmpty, isLayerGroupBEmpty);
			return;
		}

		this.#renderMask(mask, timestamp);
		this.#mixWithMask(bitDepth);
	}

	#fillMixedCanvasBackground() {
		this.#ctxMixed.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxMixed.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
	}

	/**
	 * Draw active layer groups onto mixed with default source-over (no mask).
	 * When both A and B have content, A is drawn first then B on top.
	 * @param {boolean} isLayerGroupAEmpty
	 * @param {boolean} isLayerGroupBEmpty
	 */
	#drawUnmaskedLayerGroups(isLayerGroupAEmpty, isLayerGroupBEmpty) {
		if (!isLayerGroupAEmpty) {
			this.#ctxMixed.drawImage(this.#canvasA, 0, 0);
		}
		if (!isLayerGroupBEmpty) {
			this.#ctxMixed.drawImage(this.#canvasB, 0, 0);
		}
	}

	/**
	 * Draw the active mask into ctxMask. When the clip has finished (once /
	 * non-loop latch), leave the previous pixels alone so the last frame holds
	 * the mix instead of wiping to solid black (A-only forever).
	 * @param {import('./Clip.js').default} mask
	 * @param {number} timestamp
	 */
	#renderMask(mask, timestamp) {
		if (mask.isFinished) {
			return;
		}
		this.#ctxMask.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxMask.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		mask.renderToContext(this.#ctxMask, timestamp);
	}

	/**
	 * Mix Layer Group A (ctxA) and Layer Group B (ctxB) using the current mask data and write to ctxMixed.
	 * @param {number} bitDepth - Mask bit depth (1, 2, 4, or 8)
	 */
	#mixWithMask(bitDepth) {
		this.#ensurePixelBuffers();

		this.#pixelBuffers.layerGroupA.set(this.#ctxA.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight).data);
		this.#pixelBuffers.layerGroupB.set(this.#ctxB.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight).data);
		this.#pixelBuffers.mask.set(this.#ctxMask.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight).data);
		this.#pixelBuffers.output = this.#mixedImageData.data;

		this.#mixPixels(this.#pixelBuffers, this.#pixelCount, bitDepth);
		this.#ctxMixed.putImageData(this.#mixedImageData, 0, 0);
	}

	/**
	 * Create or resize the persistent pixel buffers used by the compositor.
	 * Called from the constructor and before every masked mix; reallocates only when dimensions change.
	 */
	#ensurePixelBuffers() {
		this.#pixelCount = this.#canvasWidth * this.#canvasHeight;
		const expectedLength = this.#pixelCount * RGBA_CHANNEL_COUNT;

		if (!this.#pixelBuffers.layerGroupA || this.#pixelBuffers.layerGroupA.length !== expectedLength) {
			this.#pixelBuffers.layerGroupA = new Uint8ClampedArray(expectedLength);
			this.#pixelBuffers.layerGroupB = new Uint8ClampedArray(expectedLength);
			this.#pixelBuffers.mask = new Uint8ClampedArray(expectedLength);
		}

		if (!this.#mixedImageData || this.#mixedImageData.width !== this.#canvasWidth || this.#mixedImageData.height !== this.#canvasHeight) {
			this.#mixedImageData = this.#ctxMixed.createImageData(this.#canvasWidth, this.#canvasHeight);
		}
	}

	/**
	 * Mix pixels based on bit depth. Alpha is preserved from whichever layer group has higher opacity.
	 * @param {{layerGroupA: Uint8ClampedArray, layerGroupB: Uint8ClampedArray, mask: Uint8ClampedArray, output: Uint8ClampedArray}} buffers
	 * @param {number} pixelCount - Total number of pixels to process
	 * @param {number} bitDepth - Mask bit depth (1, 2, 4, or 8)
	 */
	#mixPixels(buffers, pixelCount, bitDepth) {
		if (bitDepth === 1) {
			this.#mixPixels1Bit(buffers, pixelCount);
		} else {
			const { divisor, maxLevel } = this.#getBitDepthParams(bitDepth);
			this.#mixPixelsMultiBit(buffers, pixelCount, divisor, maxLevel);
		}
	}

	#mixPixels1Bit(buffers, pixelCount) {
		for (let i = 0; i < pixelCount; i++) {
			const byteOffset = i * RGBA_CHANNEL_COUNT;
			const maskValue = buffers.mask[byteOffset];
			this.#mixPixel1Bit(buffers, byteOffset, maskValue);
		}
	}

	#mixPixelsMultiBit(buffers, pixelCount, divisor, maxLevel) {
		for (let i = 0; i < pixelCount; i++) {
			const byteOffset = i * RGBA_CHANNEL_COUNT;
			const maskValue = buffers.mask[byteOffset];
			this.#mixPixelMultiBit(buffers, byteOffset, maskValue, divisor, maxLevel);
		}
	}

	#mixPixel1Bit(buffers, byteOffset, maskValue) {
		const sourcePixels = maskValue < BIT_DEPTH_MIXING.THRESHOLD_1BIT ? buffers.layerGroupA : buffers.layerGroupB;
		buffers.output[byteOffset] = sourcePixels[byteOffset];
		buffers.output[byteOffset + 1] = sourcePixels[byteOffset + 1];
		buffers.output[byteOffset + 2] = sourcePixels[byteOffset + 2];
		buffers.output[byteOffset + RGBA_CHANNEL_COUNT - 1] = Math.max(buffers.layerGroupA[byteOffset + RGBA_CHANNEL_COUNT - 1], buffers.layerGroupB[byteOffset + RGBA_CHANNEL_COUNT - 1]);
	}

	#mixPixelMultiBit(buffers, byteOffset, maskValue, divisor, maxLevel) {
		const blendFactor = Math.floor(maskValue / divisor) / maxLevel;
		this.#blendPixel(buffers, byteOffset, blendFactor);
	}

	#getBitDepthParams(bitDepth) {
		if (bitDepth === 2) {
			return { divisor: BIT_DEPTH_MIXING.DIVISOR_2BIT, maxLevel: BIT_DEPTH_MIXING.MAX_LEVEL_2BIT };
		}
		if (bitDepth === 4) {
			return { divisor: BIT_DEPTH_MIXING.DIVISOR_4BIT, maxLevel: BIT_DEPTH_MIXING.MAX_LEVEL_4BIT };
		}
		return { divisor: 1, maxLevel: BIT_DEPTH_MIXING.MAX_LEVEL_8BIT };
	}

	#blendPixel(buffers, byteOffset, blendFactor) {
		for (let channel = 0; channel < RGB_CHANNEL_COUNT; channel++) {
			buffers.output[byteOffset + channel] = buffers.layerGroupA[byteOffset + channel] + (buffers.layerGroupB[byteOffset + channel] - buffers.layerGroupA[byteOffset + channel]) * blendFactor;
		}
		buffers.output[byteOffset + RGBA_CHANNEL_COUNT - 1] = Math.max(buffers.layerGroupA[byteOffset + RGBA_CHANNEL_COUNT - 1], buffers.layerGroupB[byteOffset + RGBA_CHANNEL_COUNT - 1]);
	}

	/**
	 * Release references for garbage collection.
	 */
	destroy() {
		this.#canvasA = null;
		this.#ctxA = null;
		this.#canvasB = null;
		this.#ctxB = null;
		this.#ctxMask = null;
		this.#canvasMixed = null;
		this.#ctxMixed = null;
		this.#mixedImageData = null;
		this.#pixelCount = 0;
		this.#pixelBuffers = { layerGroupA: null, layerGroupB: null, mask: null, output: null };
	}
}

export default Compositor;
