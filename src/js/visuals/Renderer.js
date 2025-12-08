/**
 * Renderer - Contains the requestAnimationFrame loop and canvas drawing logic
 * Supports multi-layer architecture with A/B mixing, effects, and overlays
 *
 * Rendering order:
 * 1. Render Layer A (4 slots) → canvasA
 * 2. Render Layer B (4 slots) → canvasB
 * 3. Render Mask → canvasMask (if active)
 * 4. Composite A + B using Mask → canvasMixed
 * 5. Apply Effects A/B to canvasMixed
 * 6. Render Layer C (2 slots) on top
 * 7. Apply Global Effects
 * 8. Output to visible canvas
 */
import settings from '../core/settings.js';

class Renderer {
	#canvas2dContext;
	#layerManager;
	#isRunning = false;
	#animationFrameId = null;
	#canvasWidth;
	#canvasHeight;

	// Off-screen canvases for compositing
	#canvasA = null;
	#ctxA = null;
	#canvasB = null;
	#ctxB = null;
	#canvasMask = null;
	#ctxMask = null;
	#canvasMixed = null;
	#ctxMixed = null;

	constructor(canvas2dContext, layerManager) {
		this.#canvas2dContext = canvas2dContext;
		this.#layerManager = layerManager;
		this.#canvasWidth = settings.canvas.width;
		this.#canvasHeight = settings.canvas.height;

		// Initialize off-screen canvases
		this.#initOffscreenCanvases();
	}

	/**
	 * Initialize off-screen canvases for layer compositing
	 */
	#initOffscreenCanvases() {
		// Only create if we have a valid context
		if (!this.#canvas2dContext) {
			return;
		}

		// Create off-screen canvases
		this.#canvasA = document.createElement('canvas');
		this.#canvasA.width = this.#canvasWidth;
		this.#canvasA.height = this.#canvasHeight;
		this.#ctxA = this.#canvasA.getContext('2d');

		this.#canvasB = document.createElement('canvas');
		this.#canvasB.width = this.#canvasWidth;
		this.#canvasB.height = this.#canvasHeight;
		this.#ctxB = this.#canvasB.getContext('2d');

		this.#canvasMask = document.createElement('canvas');
		this.#canvasMask.width = this.#canvasWidth;
		this.#canvasMask.height = this.#canvasHeight;
		this.#ctxMask = this.#canvasMask.getContext('2d');

		this.#canvasMixed = document.createElement('canvas');
		this.#canvasMixed.width = this.#canvasWidth;
		this.#canvasMixed.height = this.#canvasHeight;
		this.#ctxMixed = this.#canvasMixed.getContext('2d');

		// Configure contexts
		const contexts = [this.#ctxA, this.#ctxB, this.#ctxMask, this.#ctxMixed];
		for (const ctx of contexts) {
			if (ctx) {
				ctx.imageSmoothingEnabled = settings.rendering.imageSmoothingEnabled;
				ctx.imageSmoothingQuality = settings.rendering.imageSmoothingQuality;
			}
		}
	}

	/**
	 * Start the rendering loop
	 */
	start() {
		if (!this.#isRunning) {
			this.#isRunning = true;
			this.#loop();
		}
	}

	/**
	 * Stop the rendering loop
	 */
	stop() {
		this.#isRunning = false;
		if (this.#animationFrameId) {
			cancelAnimationFrame(this.#animationFrameId);
			this.#animationFrameId = null;
		}
	}

	/**
	 * Destroy renderer and release references for GC
	 */
	destroy() {
		this.stop();
		this.#canvas2dContext = null;
		this.#layerManager = null;
		this.#canvasA = null;
		this.#ctxA = null;
		this.#canvasB = null;
		this.#ctxB = null;
		this.#canvasMask = null;
		this.#ctxMask = null;
		this.#canvasMixed = null;
		this.#ctxMixed = null;
	}

	/**
	 * Mix Layer A and Layer B using the mask
	 * @param {number} timestamp - Current timestamp
	 */
	#mixLayers(timestamp) {
		const maskManager = this.#layerManager.getMaskManager();
		const mask = maskManager.getCurrentMask();

		// Quick-path: if both A and B are empty, nothing to do
		const layerAEmpty = !this.#layerManager.getLayerA()?.hasActiveLayers();
		const layerBEmpty = !this.#layerManager.getLayerB()?.hasActiveLayers();
		if (layerAEmpty && layerBEmpty) {
			// Nothing to mix, leave mixed canvas cleared
			this.#ctxMixed.fillStyle = settings.rendering.backgroundColor;
			this.#ctxMixed.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
			return;
		}

		// Clear mixed canvas
		this.#ctxMixed.fillStyle = settings.rendering.backgroundColor;
		this.#ctxMixed.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);

		// If no mask, prefer Layer A, otherwise show Layer B
		if (!mask) {
			if (!layerAEmpty) {
				this.#ctxMixed.drawImage(this.#canvasA, 0, 0);
			} else if (!layerBEmpty) {
				this.#ctxMixed.drawImage(this.#canvasB, 0, 0);
			}
			return;
		}

		// Render the mask animation
		this.#ctxMask.fillStyle = '#000000';
		this.#ctxMask.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		if (!mask.isFinished) {
			mask.playToContext(this.#ctxMask, timestamp);
		}

		const bitDepth = maskManager.getBitDepth() ?? 1;

		// Get image data for pixel manipulation
		const layerAData = this.#ctxA.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const layerBData = this.#ctxB.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const maskData = this.#ctxMask.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const outputData = this.#ctxMixed.createImageData(this.#canvasWidth, this.#canvasHeight);

		const aPixels = layerAData.data;
		const bPixels = layerBData.data;
		const maskPixels = maskData.data;
		const outPixels = outputData.data;

		const pixelCount = this.#canvasWidth * this.#canvasHeight;

		// Mix pixels based on bit depth
		// Note on alpha handling: We use Math.max(aPixels[idx + 3], bPixels[idx + 3]) for all bit depths.
		// This is intentional for VJ compositing - it ensures no pixel becomes transparent when mixing
		// two opaque layers. The mask controls RGB blending; alpha is preserved from whichever layer
		// has higher opacity, providing consistent visual results during live performance.
		for (let i = 0; i < pixelCount; i++) {
			const idx = i * 4;
			const maskValue = maskPixels[idx]; // Use R channel (grayscale: R=G=B)

			if (bitDepth === 1) {
				// 1-bit: hard cut
				if (maskValue < 128) {
					outPixels[idx] = aPixels[idx];
					outPixels[idx + 1] = aPixels[idx + 1];
					outPixels[idx + 2] = aPixels[idx + 2];
					outPixels[idx + 3] = Math.max(aPixels[idx + 3], bPixels[idx + 3]);
				} else {
					outPixels[idx] = bPixels[idx];
					outPixels[idx + 1] = bPixels[idx + 1];
					outPixels[idx + 2] = bPixels[idx + 2];
					outPixels[idx + 3] = Math.max(aPixels[idx + 3], bPixels[idx + 3]);
				}
			} else if (bitDepth === 2) {
				// 2-bit: 4 levels -> alpha = level/3
				const level2 = Math.floor(maskValue / 64);
				const alpha2 = level2 / 3;
				outPixels[idx] = aPixels[idx] + (bPixels[idx] - aPixels[idx]) * alpha2;
				outPixels[idx + 1] = aPixels[idx + 1] + (bPixels[idx + 1] - aPixels[idx + 1]) * alpha2;
				outPixels[idx + 2] = aPixels[idx + 2] + (bPixels[idx + 2] - aPixels[idx + 2]) * alpha2;
				outPixels[idx + 3] = Math.max(aPixels[idx + 3], bPixels[idx + 3]);
			} else if (bitDepth === 4) {
				// 4-bit: 16 levels -> alpha = level/15
				const level4 = Math.floor(maskValue / 16);
				const alpha4 = level4 / 15;
				outPixels[idx] = aPixels[idx] + (bPixels[idx] - aPixels[idx]) * alpha4;
				outPixels[idx + 1] = aPixels[idx + 1] + (bPixels[idx + 1] - aPixels[idx + 1]) * alpha4;
				outPixels[idx + 2] = aPixels[idx + 2] + (bPixels[idx + 2] - aPixels[idx + 2]) * alpha4;
				outPixels[idx + 3] = Math.max(aPixels[idx + 3], bPixels[idx + 3]);
			} else {
				// Smooth blend: A + (B - A) * alpha
				const alpha = maskValue / 255;
				outPixels[idx] = aPixels[idx] + (bPixels[idx] - aPixels[idx]) * alpha;
				outPixels[idx + 1] = aPixels[idx + 1] + (bPixels[idx + 1] - aPixels[idx + 1]) * alpha;
				outPixels[idx + 2] = aPixels[idx + 2] + (bPixels[idx + 2] - aPixels[idx + 2]) * alpha;
				outPixels[idx + 3] = Math.max(aPixels[idx + 3], bPixels[idx + 3]); // Take max alpha
			}
		}

		this.#ctxMixed.putImageData(outputData, 0, 0);
	}

	/**
	 * Apply effects to a canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 * @param {Array<{type: string, velocity: number}>} effects - Active effects
	 */
	#applyEffects(ctx, effects) {
		if (!effects || effects.length === 0) {
			return;
		}

		const imageData = ctx.getImageData(0, 0, this.#canvasWidth, this.#canvasHeight);
		const data = imageData.data;

		for (const effect of effects) {
			const intensity = effect.velocity / 127; // Normalize to 0-1

			switch (effect.type) {
				case 'split':
					this.#applySplitEffect(ctx, imageData, effect.note, intensity);
					return; // Split modifies canvas directly
				case 'mirror':
					this.#applyMirrorEffect(ctx, imageData, effect.note, intensity);
					return; // Mirror modifies the canvas directly
				case 'offset':
					this.#applyOffsetEffect(ctx, imageData, effect.note, intensity);
					return; // Offset modifies canvas directly
				case 'color':
					this.#applyColorEffect(data, effect.note, intensity);
					break;
				case 'glitch':
					this.#applyGlitchEffect(data, intensity);
					break;
				case 'strobe':
					this.#applyStrobeEffect(data, intensity);
					break;
				default:
					break;
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}

	/**
	 * Apply color effects (invert, threshold, posterize)
	 */
	#applyColorEffect(data, note, intensity) {
		const noteInRange = note - settings.effectRanges.color.min;

		if (noteInRange < 8) {
			// Invert colors
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255 - data[i];
				data[i + 1] = 255 - data[i + 1];
				data[i + 2] = 255 - data[i + 2];
			}
		} else {
			// Posterize
			const levels = Math.max(2, Math.floor(8 - intensity * 6));
			const step = 255 / levels;
			for (let i = 0; i < data.length; i += 4) {
				data[i] = Math.floor(data[i] / step) * step;
				data[i + 1] = Math.floor(data[i + 1] / step) * step;
				data[i + 2] = Math.floor(data[i + 2] / step) * step;
			}
		}
	}

	/**
	 * Apply mirror effect
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 * @param {ImageData} imageData - Source image data
	 * @param {number} note - MIDI note number
	 * @param {number} _intensity - Effect intensity (reserved for future use)
	 */
	#applyMirrorEffect(ctx, imageData, note, _intensity) {
		// TODO: Use _intensity to blend between original and mirrored image.
		// Currently, _intensity is unused; only full mirroring is applied.
		// Planned behavior:
		//   - _intensity = 0 -> show original
		//   - _intensity = 1 -> show mirrored image
		//   - intermediate values blend the mirrored and original images per-pixel
		const noteInRange = note - settings.effectRanges.mirror.min;
		const data = imageData.data;
		const w = this.#canvasWidth;
		const h = this.#canvasHeight;

		if (noteInRange < 8) {
			// Horizontal mirror
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w / 2; x++) {
					const srcIdx = (y * w + x) * 4;
					const dstIdx = (y * w + (w - 1 - x)) * 4;
					data[dstIdx] = data[srcIdx];
					data[dstIdx + 1] = data[srcIdx + 1];
					data[dstIdx + 2] = data[srcIdx + 2];
					data[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		} else {
			// Vertical mirror
			for (let y = 0; y < h / 2; y++) {
				for (let x = 0; x < w; x++) {
					const srcIdx = (y * w + x) * 4;
					const dstIdx = ((h - 1 - y) * w + x) * 4;
					data[dstIdx] = data[srcIdx];
					data[dstIdx + 1] = data[srcIdx + 1];
					data[dstIdx + 2] = data[srcIdx + 2];
					data[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		}

		ctx.putImageData(imageData, 0, 0);
	}

	/**
	 * Apply glitch effect
	 * Uses horizontal pixel displacement for a digital glitch aesthetic.
	 * The effect randomly shifts pixels left/right by sampling neighboring pixel data.
	 * Offset is constrained to stay within the same row to prevent vertical artifacts.
	 */
	#applyGlitchEffect(data, intensity) {
		// Random horizontal pixel displacement based on intensity
		const glitchAmount = Math.floor(intensity * 20);
		const w = this.#canvasWidth;
		const rowBytes = w * 4;

		// Create a copy of original data to avoid reading already-modified pixels
		const original = new Uint8ClampedArray(data);

		for (let i = 0; i < data.length; i += 4) {
			if (Math.random() < intensity * 0.1) {
				// Calculate row boundaries to prevent vertical wrapping
				const rowStart = Math.floor(i / rowBytes) * rowBytes;
				const rowEnd = rowStart + rowBytes - 4;

				// Offset in bytes (horizontal pixel displacement), constrained to same row
				const offsetPx = Math.floor(Math.random() * (glitchAmount + 1)) - Math.floor(glitchAmount / 2);
				const offsetBytes = offsetPx * 4;
				const srcIdx = Math.max(rowStart, Math.min(rowEnd, i + offsetBytes));
				data[i] = original[srcIdx];
				data[i + 1] = original[srcIdx + 1];
				data[i + 2] = original[srcIdx + 2];
			}
		}
	}

	/**
	 * Apply strobe effect
	 */
	#applyStrobeEffect(data, intensity) {
		// Flash to white based on intensity and time
		const flash = Math.random() < intensity * 0.3;
		if (flash) {
			for (let i = 0; i < data.length; i += 4) {
				data[i] = 255;
				data[i + 1] = 255;
				data[i + 2] = 255;
			}
		}
	}

	/**
	 * Apply split effect (divide screen into sections)
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 * @param {ImageData} imageData - Source image data
	 * @param {number} note - MIDI note number
	 * @param {number} _intensity - Effect intensity (reserved for future use)
	 */
	#applySplitEffect(ctx, imageData, note, _intensity) {
		// TODO: Use _intensity to animate split transitions or blend between states.
		// Currently, _intensity is unused; splits are applied at full intensity.
		// Planned behavior:
		//   - _intensity = 0 -> show original
		//   - _intensity = 1 -> show split fully
		// TODO: Could also use intensity to dynamically change the number of splits:
		// splits = baseSplits + Math.round(_intensity * extraSplits);
		const data = imageData.data;
		const w = this.#canvasWidth;
		const h = this.#canvasHeight;
		const noteInRange = note - settings.effectRanges.split.min;

		// Number of splits based on note (2-8 splits)
		const splits = Math.min(8, Math.max(2, Math.floor(noteInRange / 2) + 2));

		// Create output buffer to avoid reading already-modified pixels
		const output = new Uint8ClampedArray(data.length);

		if (noteInRange < 8) {
			// Horizontal split - use modulo wrapping for proper repeating pattern
			const sectionWidth = Math.floor(w / splits);
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const srcX = ((x % sectionWidth) * splits) % w;
					const srcIdx = (y * w + srcX) * 4;
					const dstIdx = (y * w + x) * 4;
					output[dstIdx] = data[srcIdx];
					output[dstIdx + 1] = data[srcIdx + 1];
					output[dstIdx + 2] = data[srcIdx + 2];
					output[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		} else {
			// Vertical split - use modulo wrapping for proper repeating pattern
			const sectionHeight = Math.floor(h / splits);
			for (let y = 0; y < h; y++) {
				const srcY = ((y % sectionHeight) * splits) % h;
				for (let x = 0; x < w; x++) {
					const srcIdx = (srcY * w + x) * 4;
					const dstIdx = (y * w + x) * 4;
					output[dstIdx] = data[srcIdx];
					output[dstIdx + 1] = data[srcIdx + 1];
					output[dstIdx + 2] = data[srcIdx + 2];
					output[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		}

		// Copy output back to data
		for (let i = 0; i < data.length; i++) {
			data[i] = output[i];
		}

		ctx.putImageData(imageData, 0, 0);
	}

	/**
	 * Apply offset effect (shift image with wrap-around)
	 */
	#applyOffsetEffect(ctx, imageData, note, intensity) {
		const data = imageData.data;
		const w = this.#canvasWidth;
		const h = this.#canvasHeight;
		const noteInRange = note - settings.effectRanges.offset.min;

		// Create output buffer
		const output = new Uint8ClampedArray(data.length);

		if (noteInRange < 8) {
			// Horizontal offset
			const offsetX = Math.floor(intensity * w);
			for (let y = 0; y < h; y++) {
				for (let x = 0; x < w; x++) {
					const srcX = (x + offsetX) % w;
					const srcIdx = (y * w + srcX) * 4;
					const dstIdx = (y * w + x) * 4;
					output[dstIdx] = data[srcIdx];
					output[dstIdx + 1] = data[srcIdx + 1];
					output[dstIdx + 2] = data[srcIdx + 2];
					output[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		} else {
			// Vertical offset
			const offsetY = Math.floor(intensity * h);
			for (let y = 0; y < h; y++) {
				const srcY = (y + offsetY) % h;
				for (let x = 0; x < w; x++) {
					const srcIdx = (srcY * w + x) * 4;
					const dstIdx = (y * w + x) * 4;
					output[dstIdx] = data[srcIdx];
					output[dstIdx + 1] = data[srcIdx + 1];
					output[dstIdx + 2] = data[srcIdx + 2];
					output[dstIdx + 3] = data[srcIdx + 3];
				}
			}
		}

		// Copy output back to data
		for (let i = 0; i < data.length; i++) {
			data[i] = output[i];
		}

		ctx.putImageData(imageData, 0, 0);
	}

	/**
	 * Main rendering loop - renders all layers with proper compositing
	 */
	#loop = (timestamp = performance.now()) => {
		if (!this.#isRunning) {
			return;
		}

		// Clear the main canvas
		if (this.#canvas2dContext) {
			this.#canvas2dContext.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		}

		const layerA = this.#layerManager?.getLayerA();
		const layerB = this.#layerManager?.getLayerB();
		const layerC = this.#layerManager?.getLayerC();
		const effectsManager = this.#layerManager?.getEffectsManager();

		if (!layerA || !this.#ctxA) {
			this.#animationFrameId = requestAnimationFrame(this.#loop);
			return;
		}

		// Clear off-screen canvases
		this.#ctxA.fillStyle = settings.rendering.backgroundColor;
		this.#ctxA.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);
		this.#ctxB.fillStyle = settings.rendering.backgroundColor;
		this.#ctxB.fillRect(0, 0, this.#canvasWidth, this.#canvasHeight);

		// Render Layer A
		this.#renderLayerGroup(this.#ctxA, layerA, timestamp);

		// Render Layer B
		this.#renderLayerGroup(this.#ctxB, layerB, timestamp);

		// Mix A and B using mask
		this.#mixLayers(timestamp);

		// Apply A/B effects
		if (effectsManager?.hasEffectsAB()) {
			this.#applyEffects(this.#ctxMixed, effectsManager.getActiveEffectsAB());
		}

		// Draw mixed result to main canvas
		this.#canvas2dContext.drawImage(this.#canvasMixed, 0, 0);

		// Render Layer C (overlay) directly on main canvas
		this.#renderLayerGroup(this.#canvas2dContext, layerC, timestamp);

		// Apply global effects
		if (effectsManager?.hasEffectsGlobal()) {
			this.#applyEffects(this.#canvas2dContext, effectsManager.getActiveEffectsGlobal());
		}

		this.#animationFrameId = requestAnimationFrame(this.#loop);
	};

	/**
	 * Render a layer group to a specific canvas context
	 * @param {CanvasRenderingContext2D} ctx - Target context
	 * @param {LayerGroup} layerGroup - Layer group to render
	 * @param {number} timestamp - Current timestamp
	 */
	#renderLayerGroup(ctx, layerGroup, timestamp) {
		if (!layerGroup) {
			return;
		}

		const layers = layerGroup.getActiveLayers();

		for (const layer of layers) {
			if (layer && !layer.isFinished) {
				// Use playToContext for off-screen rendering
				layer.playToContext(ctx, timestamp);
			}
		}
	}

	/**
	 * Get rendering statistics for debugging
	 * @returns {{isRunning: boolean, frameId: number|null}} Current renderer state
	 */
	getStats() {
		return {
			isRunning: this.#isRunning,
			frameId: this.#animationFrameId
		};
	}
}

export default Renderer;
