import { RGBA_CHANNEL_COUNT } from './effects/effectConstants.js';

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
	MAX_VALUE_8BIT: 255
};

/**
 * Compositor - Manages off-screen canvases and Layer Group A and Layer Group B blending.
 *
 * Responsibilities:
 * - Create and own off-screen canvases for Layer Group A, Layer Group B, Mask, and Mixed output.
 * - Clear layer group canvases each frame.
 * - Mix Layer Group A and Layer Group B using the active mask (supporting 1/2/4/8-bit masks).
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
		this.#initOffscreenCanvases();
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
	 * @returns {{ canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D }} The canvas and its 2D context
	 */
	#createOffscreenCanvas() {
		const canvas = document.createElement('canvas');
		canvas.width = this.#canvasWidth;
		canvas.height = this.#canvasHeight;
		const ctx = canvas.getContext('2d');
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
		({ canvas: this.#canvasA, ctx: this.#ctxA } = this.#createOffscreenCanvas());
		({ canvas: this.#canvasB, ctx: this.#ctxB } = this.#createOffscreenCanvas());
		({ ctx: this.#ctxMask } = this.#createOffscreenCanvas());
		({ canvas: this.#canvasMixed, ctx: this.#ctxMixed } = this.#createOffscreenCanvas());

		if (this.#ctxMixed) {
			this.#mixedImageData = this.#ctxMixed.createImageData(this.#canvasWidth, this.#canvasHeight);
		}
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

		// Always clear mixed canvas first
		this.#ctxMixed.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxMixed.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);

		if (isLayerGroupAEmpty && isLayerGroupBEmpty) {
			return;
		}

		// If no mask, prefer Layer Group A, otherwise show Layer Group B
		if (!mask) {
			if (!isLayerGroupAEmpty) {
				this.#ctxMixed.drawImage(this.#canvasA, 0, 0);
			} else if (!isLayerGroupBEmpty) {
				this.#ctxMixed.drawImage(this.#canvasB, 0, 0);
			}
			return;
		}

		// Render the mask clip
		this.#ctxMask.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxMask.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		if (!mask.isFinished) {
			mask.renderToContext(this.#ctxMask, timestamp);
		}

		this.#mixWithMask(bitDepth);
	}

	/**
	 * Mix Layer Group A (ctxA) and Layer Group B (ctxB) using the current mask data and write to ctxMixed.
	 * @param {number} bitDepth - Mask bit depth (1, 2, 4, or 8)
	 */
	#mixWithMask(bitDepth) {
		const layerGroupAImageData = this.#ctxA.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const layerGroupBImageData = this.#ctxB.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const maskImageData = this.#ctxMask.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);

		this.#ensureMixedImageData();

		const pixelBuffers = {
			layerGroupA: layerGroupAImageData.data,
			layerGroupB: layerGroupBImageData.data,
			mask: maskImageData.data,
			output: this.#mixedImageData.data
		};

		const pixelCount = this.#canvasWidth * this.#canvasHeight;
		this.#mixPixels(pixelBuffers, pixelCount, bitDepth);
		this.#ctxMixed.putImageData(this.#mixedImageData, 0, 0);
	}

	#ensureMixedImageData() {
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
		for (let i = 0; i < pixelCount; i++) {
			const idx = i * RGBA_CHANNEL_COUNT;
			const maskValue = buffers.mask[idx];

			if (bitDepth === 1) {
				this.#mix1Bit(buffers, idx, maskValue);
			} else {
				this.#mixMultiBit(buffers, idx, maskValue, bitDepth);
			}
		}
	}

	#mix1Bit(buffers, idx, maskValue) {
		const sourcePixels = maskValue < BIT_DEPTH_MIXING.THRESHOLD_1BIT ? buffers.layerGroupA : buffers.layerGroupB;
		buffers.output[idx] = sourcePixels[idx];
		buffers.output[idx + 1] = sourcePixels[idx + 1];
		buffers.output[idx + 2] = sourcePixels[idx + 2];
		buffers.output[idx + 3] = Math.max(buffers.layerGroupA[idx + 3], buffers.layerGroupB[idx + 3]);
	}

	#mixMultiBit(buffers, idx, maskValue, bitDepth) {
		const { divisor, maxLevel } = this.#getBitDepthParams(bitDepth);
		const alpha = Math.floor(maskValue / divisor) / maxLevel;
		this.#blendPixel(buffers, idx, alpha);
	}

	#getBitDepthParams(bitDepth) {
		if (bitDepth === 2) {
			return { divisor: BIT_DEPTH_MIXING.DIVISOR_2BIT, maxLevel: BIT_DEPTH_MIXING.MAX_LEVEL_2BIT };
		}
		if (bitDepth === 4) {
			return { divisor: BIT_DEPTH_MIXING.DIVISOR_4BIT, maxLevel: BIT_DEPTH_MIXING.MAX_LEVEL_4BIT };
		}
		return { divisor: 1, maxLevel: BIT_DEPTH_MIXING.MAX_VALUE_8BIT };
	}

	#blendPixel(buffers, idx, alpha) {
		for (let channel = 0; channel < 3; channel++) {
			buffers.output[idx + channel] = buffers.layerGroupA[idx + channel] + (buffers.layerGroupB[idx + channel] - buffers.layerGroupA[idx + channel]) * alpha;
		}
		buffers.output[idx + 3] = Math.max(buffers.layerGroupA[idx + 3], buffers.layerGroupB[idx + 3]);
	}

	/**
	 * Release references for garbage collection.
	 */
	destroy() {
		try {
			this.#canvasA = null;
			this.#ctxA = null;
		} catch (error) {
			console.error('Error releasing canvasA references in Compositor:', error);
		}
		try {
			this.#canvasB = null;
			this.#ctxB = null;
		} catch (error) {
			console.error('Error releasing canvasB references in Compositor:', error);
		}
		try {
			this.#ctxMask = null;
		} catch (error) {
			console.error('Error releasing ctxMask reference in Compositor:', error);
		}
		try {
			this.#canvasMixed = null;
			this.#ctxMixed = null;
			this.#mixedImageData = null;
		} catch (error) {
			console.error('Error releasing mixed canvas references in Compositor:', error);
		}
	}
}

export default Compositor;
