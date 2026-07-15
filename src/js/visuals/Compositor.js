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
	 * @param {import('./AnimationClip.js').default|null} compositingInput.mask - Active mask clip, or null
	 * @param {number} compositingInput.bitDepth - Mask bit depth (1, 2, 4, or 8)
	 * @param {boolean} compositingInput.layerGroupAEmpty - Whether Layer Group A has no active clips
	 * @param {boolean} compositingInput.layerGroupBEmpty - Whether Layer Group B has no active clips
	 * @param {number} timestamp - Current RAF timestamp
	 */
	mixLayerGroups({ mask, bitDepth, layerGroupAEmpty, layerGroupBEmpty }, timestamp) {
		if (!this.#ctxA || !this.#ctxB || !this.#ctxMask || !this.#ctxMixed) {
			return;
		}

		// Always clear mixed canvas first
		this.#ctxMixed.fillStyle = this.#renderingConfig.backgroundColor;
		this.#ctxMixed.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);

		if (layerGroupAEmpty && layerGroupBEmpty) {
			return;
		}

		// If no mask, prefer Layer Group A, otherwise show Layer Group B
		if (!mask) {
			if (!layerGroupAEmpty) {
				this.#ctxMixed.drawImage(this.#canvasA, 0, 0);
			} else if (!layerGroupBEmpty) {
				this.#ctxMixed.drawImage(this.#canvasB, 0, 0);
			}
			return;
		}

		// Render the mask clip
		this.#ctxMask.fillStyle = '#000000';
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

		if (!this.#mixedImageData || this.#mixedImageData.width !== this.#canvasWidth || this.#mixedImageData.height !== this.#canvasHeight) {
			this.#mixedImageData = this.#ctxMixed.createImageData(this.#canvasWidth, this.#canvasHeight);
		}

		const layerGroupAPixels = layerGroupAImageData.data;
		const layerGroupBPixels = layerGroupBImageData.data;
		const maskPixels = maskImageData.data;
		const outPixels = this.#mixedImageData.data;
		const pixelCount = this.#canvasWidth * this.#canvasHeight;

		// Mix pixels based on bit depth.
		// Alpha is preserved from whichever layer group has higher opacity.
		for (let i = 0; i < pixelCount; i++) {
			const pixelByteIndex = i * RGBA_CHANNEL_COUNT;
			const maskValue = maskPixels[pixelByteIndex];

			if (bitDepth === 1) {
				if (maskValue < BIT_DEPTH_MIXING.THRESHOLD_1BIT) {
					outPixels[pixelByteIndex] = layerGroupAPixels[pixelByteIndex];
					outPixels[pixelByteIndex + 1] = layerGroupAPixels[pixelByteIndex + 1];
					outPixels[pixelByteIndex + 2] = layerGroupAPixels[pixelByteIndex + 2];
				} else {
					outPixels[pixelByteIndex] = layerGroupBPixels[pixelByteIndex];
					outPixels[pixelByteIndex + 1] = layerGroupBPixels[pixelByteIndex + 1];
					outPixels[pixelByteIndex + 2] = layerGroupBPixels[pixelByteIndex + 2];
				}
				outPixels[pixelByteIndex + 3] = Math.max(layerGroupAPixels[pixelByteIndex + 3], layerGroupBPixels[pixelByteIndex + 3]);
			} else if (bitDepth === 2) {
				const level2 = Math.floor(maskValue / BIT_DEPTH_MIXING.DIVISOR_2BIT);
				const alpha2 = level2 / BIT_DEPTH_MIXING.MAX_LEVEL_2BIT;
				outPixels[pixelByteIndex] = layerGroupAPixels[pixelByteIndex] + (layerGroupBPixels[pixelByteIndex] - layerGroupAPixels[pixelByteIndex]) * alpha2;
				outPixels[pixelByteIndex + 1] = layerGroupAPixels[pixelByteIndex + 1] + (layerGroupBPixels[pixelByteIndex + 1] - layerGroupAPixels[pixelByteIndex + 1]) * alpha2;
				outPixels[pixelByteIndex + 2] = layerGroupAPixels[pixelByteIndex + 2] + (layerGroupBPixels[pixelByteIndex + 2] - layerGroupAPixels[pixelByteIndex + 2]) * alpha2;
				outPixels[pixelByteIndex + 3] = Math.max(layerGroupAPixels[pixelByteIndex + 3], layerGroupBPixels[pixelByteIndex + 3]);
			} else if (bitDepth === 4) {
				const level4 = Math.floor(maskValue / BIT_DEPTH_MIXING.DIVISOR_4BIT);
				const alpha4 = level4 / BIT_DEPTH_MIXING.MAX_LEVEL_4BIT;
				outPixels[pixelByteIndex] = layerGroupAPixels[pixelByteIndex] + (layerGroupBPixels[pixelByteIndex] - layerGroupAPixels[pixelByteIndex]) * alpha4;
				outPixels[pixelByteIndex + 1] = layerGroupAPixels[pixelByteIndex + 1] + (layerGroupBPixels[pixelByteIndex + 1] - layerGroupAPixels[pixelByteIndex + 1]) * alpha4;
				outPixels[pixelByteIndex + 2] = layerGroupAPixels[pixelByteIndex + 2] + (layerGroupBPixels[pixelByteIndex + 2] - layerGroupAPixels[pixelByteIndex + 2]) * alpha4;
				outPixels[pixelByteIndex + 3] = Math.max(layerGroupAPixels[pixelByteIndex + 3], layerGroupBPixels[pixelByteIndex + 3]);
			} else {
				const alpha = maskValue / BIT_DEPTH_MIXING.MAX_VALUE_8BIT;
				outPixels[pixelByteIndex] = layerGroupAPixels[pixelByteIndex] + (layerGroupBPixels[pixelByteIndex] - layerGroupAPixels[pixelByteIndex]) * alpha;
				outPixels[pixelByteIndex + 1] = layerGroupAPixels[pixelByteIndex + 1] + (layerGroupBPixels[pixelByteIndex + 1] - layerGroupAPixels[pixelByteIndex + 1]) * alpha;
				outPixels[pixelByteIndex + 2] = layerGroupAPixels[pixelByteIndex + 2] + (layerGroupBPixels[pixelByteIndex + 2] - layerGroupAPixels[pixelByteIndex + 2]) * alpha;
				outPixels[pixelByteIndex + 3] = Math.max(layerGroupAPixels[pixelByteIndex + 3], layerGroupBPixels[pixelByteIndex + 3]);
			}
		}

		this.#ctxMixed.putImageData(this.#mixedImageData, 0, 0);
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
	}
}

export default Compositor;
