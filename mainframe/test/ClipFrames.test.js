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

	test('duration getter returns the duration', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 750);
		expect(element.duration).toBe(750);
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
		expect(eventDetail.duration).toBe(250);
	});

	test('cleans up on disconnect', () => {
		element.setFrame(0, 'data:image/png;base64,abc', 1000);
		element.remove();
		expect(element.children.length).toBe(0);
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
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 }
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
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 },
			{ src: 'data:image/png;base64,ccc', duration: 300 }
		]);

		expect(element.getFrameOrder()).toEqual([0, 1, 2]);
	});

	test('getDurations returns durations in order', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 }
		]);

		expect(element.getDurations()).toEqual([100, 200]);
	});

	test('default duration is 1000 when not specified', () => {
		element.loadFrames([{ src: 'data:image/png;base64,aaa' }]);

		expect(element.getDurations()).toEqual([1000]);
	});

	test('removeFrameAt removes a frame and emits frameremove', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 },
			{ src: 'data:image/png;base64,ccc', duration: 300 }
		]);
		let removed = null;
		element.addEventListener('frameremove', event => {
			removed = event.detail.frameIndex;
		});
		element.removeFrameAt(1);
		expect(removed).toBe(1);
		expect(element.frameCount).toBe(2);
		expect(element.getDurations()).toEqual([100, 300]);
	});

	test('clearAll empties frames', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 }
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
		element.loadFrames([{ src: 'data:image/png;base64,aaa', duration: 100 }]);

		let eventDetail = null;
		element.addEventListener('durationchange', event => {
			eventDetail = event.detail;
		});

		const frame = element.querySelector('clip-frame');
		const durationInput = frame.querySelector('.clip-frame-duration');
		durationInput.value = '500';
		durationInput.dispatchEvent(new Event('change'));

		expect(eventDetail.frameIndex).toBe(0);
		expect(eventDetail.duration).toBe(500);
	});

	test('cleans up on disconnect', () => {
		element.loadFrames([{ src: 'data:image/png;base64,aaa', duration: 100 }]);
		element.remove();
		expect(element.children.length).toBe(0);
	});

	test('duration edits persist across reorder', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 1000 },
			{ src: 'data:image/png;base64,bbb', duration: 1000 }
		]);

		// Edit duration of first frame
		const frame0 = element.querySelectorAll('clip-frame')[0];
		const durationInput0 = frame0.querySelector('.clip-frame-duration');
		durationInput0.value = '500';
		durationInput0.dispatchEvent(new Event('change'));

		// Verify the duration was synced into internal state
		expect(element.getDurations()).toEqual([500, 1000]);

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
		expect(element.getDurations()).toEqual([1000, 500]);
	});

	test('setAllDurations applies the same ms to every frame', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 100 },
			{ src: 'data:image/png;base64,bbb', duration: 200 },
			{ src: 'data:image/png;base64,ccc', duration: 300 }
		]);

		let detail = null;
		element.addEventListener('durationchange', event => {
			detail = event.detail;
		});

		expect(element.setAllDurations(250)).toBe(250);
		expect(element.getDurations()).toEqual([250, 250, 250]);
		expect(element.areDurationsUniform()).toBe(true);
		expect(detail).toEqual({ all: true, duration: 250 });

		for (const frame of element.querySelectorAll('clip-frame')) {
			expect(frame.querySelector('.clip-frame-duration').value).toBe('250');
		}
	});

	test('areDurationsUniform is false after a single frame edit', () => {
		element.loadFrames([
			{ src: 'data:image/png;base64,aaa', duration: 1000 },
			{ src: 'data:image/png;base64,bbb', duration: 1000 }
		]);
		expect(element.areDurationsUniform()).toBe(true);

		const durationInput = element.querySelector('clip-frame .clip-frame-duration');
		durationInput.value = '400';
		durationInput.dispatchEvent(new Event('change'));

		expect(element.areDurationsUniform()).toBe(false);
		expect(element.getDurations()).toEqual([400, 1000]);
	});
});
