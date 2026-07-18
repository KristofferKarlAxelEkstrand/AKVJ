// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/ClipFrame.js';
import '../src/js/ClipFrames.js';

describe('ClipFrame', () => {
	/** @type {import('../src/js/ClipFrame.js').ClipFrame} */
	let element;

	beforeEach(() => {
		element = document.createElement('clip-frame');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('setFrame renders image, index label, and duration input', () => {
		element.setFrame(2, 'data:image/png;base64,abc', 500);

		const img = element.querySelector('.clip-frame-img');
		expect(img).not.toBeNull();
		expect(img.src).toContain('abc');

		const label = element.querySelector('.clip-frame-index');
		expect(label.textContent).toBe('3');

		const durationInput = element.querySelector('.clip-frame-duration');
		expect(durationInput.value).toBe('500');
	});

	test('frameIndex getter returns the frame index', () => {
		element.setFrame(5, 'data:image/png;base64,abc', 1000);
		expect(element.frameIndex).toBe(5);
	});

	test('durationMs getter returns the duration', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 750);
		expect(element.durationMs).toBe(750);
	});

	test('dispatches durationchange event on duration input change', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 1000);

		let eventDetail = null;
		element.addEventListener('durationchange', event => {
			eventDetail = event.detail;
		});

		const durationInput = element.querySelector('.clip-frame-duration');
		durationInput.value = '250';
		durationInput.dispatchEvent(new Event('change'));

		expect(eventDetail.frameIndex).toBe(0);
		expect(eventDetail.durationMs).toBe(250);
	});

	test('cleans up on disconnect', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 1000);
		element.remove();
		expect(element.children.length).toBe(0);
	});

	test('setFrame syncs bakeConfig into scale/size/placement controls', () => {
		element.setFrame(1, 'data:image/png;base64,abc', 1000, {
			scaleMode: 'custom',
			width: 48,
			height: 36,
			placement: { x: 4, y: -2 }
		});

		expect(element.querySelector('.clip-frame-scale').value).toBe('custom');
		expect(element.querySelector('.clip-frame-custom-width').value).toBe('48');
		expect(element.querySelector('.clip-frame-custom-height').value).toBe('36');
		expect(element.querySelector('.clip-frame-placement-x').value).toBe('4');
		expect(element.querySelector('.clip-frame-placement-y').value).toBe('-2');
		expect(element.querySelector('.clip-frame-custom-size').hidden).toBe(false);
		expect(element.bakeConfig).toEqual({
			scaleMode: 'custom',
			width: 48,
			height: 36,
			placement: { x: 4, y: -2 }
		});
	});

	test('custom size fields hide when scale mode is not custom', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 1000, { scaleMode: 'custom', width: 32, height: 24 });
		expect(element.querySelector('.clip-frame-custom-size').hidden).toBe(false);

		const scaleSelect = element.querySelector('.clip-frame-scale');
		scaleSelect.value = 'fit';
		scaleSelect.dispatchEvent(new Event('change'));

		expect(element.querySelector('.clip-frame-custom-size').hidden).toBe(true);
		expect(element.bakeConfig.scaleMode).toBe('fit');
	});

	test('changing each bake control fires bakeconfigchange with frameIndex and bakeConfig', () => {
		element.setFrame(3, 'data:image/png;base64,abc', 1000, {
			scaleMode: 'custom',
			width: 240,
			height: 135,
			placement: { x: 0, y: 0 }
		});

		/** @type {object[]} */
		const details = [];
		element.addEventListener('bakeconfigchange', event => {
			details.push(event.detail);
		});

		const scaleSelect = element.querySelector('.clip-frame-scale');
		scaleSelect.value = 'cover';
		scaleSelect.dispatchEvent(new Event('change'));

		// Return to custom so width/height controls are meaningful again.
		scaleSelect.value = 'custom';
		scaleSelect.dispatchEvent(new Event('change'));
		details.length = 0;

		scaleSelect.value = 'stretch';
		scaleSelect.dispatchEvent(new Event('change'));
		element.querySelector('.clip-frame-custom-width').value = '80';
		element.querySelector('.clip-frame-custom-width').dispatchEvent(new Event('change'));
		element.querySelector('.clip-frame-custom-height').value = '60';
		element.querySelector('.clip-frame-custom-height').dispatchEvent(new Event('change'));
		element.querySelector('.clip-frame-placement-x').value = '7';
		element.querySelector('.clip-frame-placement-x').dispatchEvent(new Event('change'));
		element.querySelector('.clip-frame-placement-y').value = '-3';
		element.querySelector('.clip-frame-placement-y').dispatchEvent(new Event('change'));

		expect(details.length).toBe(5);
		for (const detail of details) {
			expect(detail.frameIndex).toBe(3);
			expect(detail.bakeConfig).toMatchObject({
				scaleMode: expect.any(String),
				width: expect.any(Number),
				height: expect.any(Number),
				placement: expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) })
			});
		}
		expect(details.at(-1).bakeConfig).toEqual({
			scaleMode: 'stretch',
			width: 80,
			height: 60,
			placement: { x: 7, y: -3 }
		});
	});

	test('setBakeConfig round-trips through controls without losing data', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 1000);
		const bakeConfig = {
			scaleMode: 'custom',
			width: 64,
			height: 48,
			placement: { x: 12, y: 8 }
		};
		element.setBakeConfig(bakeConfig);

		expect(element.querySelector('.clip-frame-scale').value).toBe('custom');
		expect(element.querySelector('.clip-frame-custom-width').value).toBe('64');
		expect(element.querySelector('.clip-frame-custom-height').value).toBe('48');
		expect(element.querySelector('.clip-frame-placement-x').value).toBe('12');
		expect(element.querySelector('.clip-frame-placement-y').value).toBe('8');
		expect(element.bakeConfig).toEqual(bakeConfig);

		// Emit from DOM → bakeConfig getter still matches control values.
		element.querySelector('.clip-frame-placement-x').dispatchEvent(new Event('change'));
		expect(element.bakeConfig).toEqual(bakeConfig);
	});
});

describe('ClipFrames', () => {
	/** @type {import('../src/js/ClipFrames.js').ClipFrames} */
	let element;

	beforeEach(() => {
		element = document.createElement('clip-frames');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('loadFrames renders clip-frame children', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 }
		]);

		const frames = element.querySelectorAll('clip-frame');
		expect(frames.length).toBe(2);
	});

	test('loadFrames with empty array renders no children', () => {
		element.loadFrames([]);
		expect(element.children.length).toBe(0);
	});

	test('getFrameOrder returns original indices in order', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 },
			{ src: 'data:image/png;base64,ccc', durationMs: 300 }
		]);

		expect(element.getFrameOrder()).toEqual([0, 1, 2]);
	});

	test('getDurationsMs returns durations in order', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 }
		]);

		expect(element.getDurationsMs()).toEqual([100, 200]);
	});

	test('default duration is 1000 when not specified', () => {
		element.loadFrames([{ src: 'data:image/png;base64,aaa' }]);

		expect(element.getDurationsMs()).toEqual([1000]);
	});

	test('removeFrameAt removes a frame and emits frameremove', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 },
			{ src: 'data:image/png;base64,ccc', durationMs: 300 }
		]);
		let removed = null;
		element.addEventListener('frameremove', event => {
			removed = event.detail.frameIndex;
		});
		element.removeFrameAt(1);
		expect(removed).toBe(1);
		expect(element.frameCount).toBe(2);
		expect(element.getDurationsMs()).toEqual([100, 300]);
	});

	test('clearAll empties frames', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 }
		]);
		let cleared = false;
		element.addEventListener('framescleared', () => {
			cleared = true;
		});
		element.clearAll();
		expect(cleared).toBe(true);
		expect(element.frameCount).toBe(0);
	});

	test('relays durationchange from child ClipFrame', () => {
		element.loadFrames([{ src: 'data:image/png;base64,aaa', durationMs: 100 }]);

		let eventDetail = null;
		element.addEventListener('durationchange', event => {
			eventDetail = event.detail;
		});

		const frame = element.querySelector('clip-frame');
		const durationInput = frame.querySelector('.clip-frame-duration');
		durationInput.value = '500';
		durationInput.dispatchEvent(new Event('change'));

		expect(eventDetail.frameIndex).toBe(0);
		expect(eventDetail.durationMs).toBe(500);
	});

	test('cleans up on disconnect', () => {
		element.loadFrames([{ src: 'data:image/png;base64,aaa', durationMs: 100 }]);
		element.remove();
		expect(element.children.length).toBe(0);
	});

	test('duration edits persist across reorder', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 1000 },
			{ src: 'data:image/png;base64,bbb', durationMs: 1000 }
		]);

		// Edit duration of first frame
		const frame0 = element.querySelectorAll('clip-frame')[0];
		const durationInput0 = frame0.querySelector('.clip-frame-duration');
		durationInput0.value = '500';
		durationInput0.dispatchEvent(new Event('change'));

		// Verify the duration was synced into internal state
		expect(element.getDurationsMs()).toEqual([500, 1000]);

		// Simulate reorder: drag frame 0 to position 1
		const dragStartEvent = new Event('dragstart', { bubbles: true });
		dragStartEvent.dataTransfer = { effectAllowed: '' };
		frame0.dispatchEvent(dragStartEvent);

		const frame1 = element.querySelectorAll('clip-frame')[1];
		const dragOverEvent = new Event('dragover', { bubbles: true });
		dragOverEvent.dataTransfer = { dropEffect: '' };
		frame1.dispatchEvent(dragOverEvent);
		frame1.dispatchEvent(new Event('drop', { bubbles: true }));

		// After reorder, durations should follow the frames
		expect(element.getDurationsMs()).toEqual([1000, 500]);
	});

	test('setAllDurationsMs applies the same ms to every frame', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100 },
			{ src: 'data:image/png;base64,bbb', durationMs: 200 },
			{ src: 'data:image/png;base64,ccc', durationMs: 300 }
		]);

		let detail = null;
		element.addEventListener('durationchange', event => {
			detail = event.detail;
		});

		expect(element.setAllDurationsMs(250)).toBe(250);
		expect(element.getDurationsMs()).toEqual([250, 250, 250]);
		expect(element.areDurationsMsUniform()).toBe(true);
		expect(detail).toEqual({ all: true, durationMs: 250 });

		for (const frame of element.querySelectorAll('clip-frame')) {
			expect(frame.querySelector('.clip-frame-duration').value).toBe('250');
		}
	});

	test('areDurationsMsUniform is false after a single frame edit', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 1000 },
			{ src: 'data:image/png;base64,bbb', durationMs: 1000 }
		]);
		expect(element.areDurationsMsUniform()).toBe(true);

		const durationInput = element.querySelector('clip-frame .clip-frame-duration');
		durationInput.value = '400';
		durationInput.dispatchEvent(new Event('change'));

		expect(element.areDurationsMsUniform()).toBe(false);
		expect(element.getDurationsMs()).toEqual([400, 1000]);
	});

	test('loadFrames with per-frame bakeConfig is reflected by getBakeConfigs', () => {
		element.loadFrames([
			{
				src: 'data:image/png;base64,aaa',
				durationMs: 100,
				bakeConfig: { scaleMode: 'cover', placement: { x: 2, y: -1 }, width: 80, height: 60 }
			},
			{
				src: 'data:image/png;base64,bbb',
				durationMs: 200,
				bakeConfig: { scaleMode: 'custom', placement: { x: 0, y: 3 }, width: 32, height: 24 }
			}
		]);

		expect(element.getBakeConfigs()).toEqual([
			{ scaleMode: 'cover', placement: { x: 2, y: -1 }, width: 80, height: 60 },
			{ scaleMode: 'custom', placement: { x: 0, y: 3 }, width: 32, height: 24 }
		]);
		expect(element.areBakeConfigsUniform()).toBe(false);

		const frames = element.querySelectorAll('clip-frame');
		expect(frames[0].bakeConfig.scaleMode).toBe('cover');
		expect(frames[1].querySelector('.clip-frame-custom-width').value).toBe('32');
	});

	test('setAllBakeConfigs applies to every child and reports uniform bakeconfigchange', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 100, bakeConfig: { scaleMode: 'fit' } },
			{ src: 'data:image/png;base64,bbb', durationMs: 200, bakeConfig: { scaleMode: 'none' } }
		]);

		let detail = null;
		element.addEventListener('bakeconfigchange', event => {
			detail = event.detail;
		});

		const resolved = element.setAllBakeConfigs({ scaleMode: 'cover', placement: { x: 2, y: -1 } });
		expect(resolved.scaleMode).toBe('cover');
		expect(resolved.placement).toEqual({ x: 2, y: -1 });
		expect(detail).toEqual({ all: true, bakeConfig: resolved });
		expect(element.areBakeConfigsUniform()).toBe(true);
		expect(element.getBakeConfigs()).toEqual([
			{ scaleMode: 'cover', placement: { x: 2, y: -1 }, width: 240, height: 135 },
			{ scaleMode: 'cover', placement: { x: 2, y: -1 }, width: 240, height: 135 }
		]);

		for (const frame of element.querySelectorAll('clip-frame')) {
			expect(frame.querySelector('.clip-frame-scale').value).toBe('cover');
			expect(frame.querySelector('.clip-frame-placement-x').value).toBe('2');
			expect(frame.querySelector('.clip-frame-placement-y').value).toBe('-1');
		}
	});

	test('editing one child bake control makes bake configs non-uniform', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 1000, bakeConfig: { scaleMode: 'fit' } },
			{ src: 'data:image/png;base64,bbb', durationMs: 1000, bakeConfig: { scaleMode: 'fit' } }
		]);
		expect(element.areBakeConfigsUniform()).toBe(true);

		const scaleSelect = element.querySelector('clip-frame .clip-frame-scale');
		scaleSelect.value = 'stretch';
		scaleSelect.dispatchEvent(new Event('change'));

		expect(element.areBakeConfigsUniform()).toBe(false);
		expect(element.getBakeConfigs().map(config => config.scaleMode)).toEqual(['stretch', 'fit']);
	});

	test('bakeConfig edits persist across reorder', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', durationMs: 1000, bakeConfig: { scaleMode: 'fit' } },
			{ src: 'data:image/png;base64,bbb', durationMs: 1000, bakeConfig: { scaleMode: 'cover' } }
		]);

		const frame0 = element.querySelectorAll('clip-frame')[0];
		const placementX = frame0.querySelector('.clip-frame-placement-x');
		placementX.value = '9';
		placementX.dispatchEvent(new Event('change'));
		expect(element.getBakeConfigs().map(config => config.placement.x)).toEqual([9, 0]);

		const dragStartEvent = new Event('dragstart', { bubbles: true });
		dragStartEvent.dataTransfer = { effectAllowed: '' };
		frame0.dispatchEvent(dragStartEvent);

		const frame1 = element.querySelectorAll('clip-frame')[1];
		const dragOverEvent = new Event('dragover', { bubbles: true });
		dragOverEvent.dataTransfer = { dropEffect: '' };
		frame1.dispatchEvent(dragOverEvent);
		frame1.dispatchEvent(new Event('drop', { bubbles: true }));

		expect(element.getBakeConfigs().map(config => [config.scaleMode, config.placement.x])).toEqual([
			['cover', 0],
			['fit', 9]
		]);
	});
});
