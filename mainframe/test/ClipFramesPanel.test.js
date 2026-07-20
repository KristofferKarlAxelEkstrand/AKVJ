// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../src/js/ClipFramesPanel.js';

describe('ClipFramesPanel', () => {
	/** @type {import('../src/js/ClipFramesPanel.js').default} */
	let element;

	beforeEach(() => {
		element = document.createElement('clip-frames-panel');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('renders a clip-frames element and a drop area side-by-side', () => {
		const panel = element.querySelector('.clip-frames-panel');
		expect(panel).not.toBeNull();

		const frames = element.querySelector('clip-frames#clip-frames');
		expect(frames).not.toBeNull();

		const dropZone = element.querySelector('#clip-editor-drop-zone');
		expect(dropZone).not.toBeNull();

		const fileInput = element.querySelector('#clip-editor-files');
		expect(fileInput).not.toBeNull();
	});

	test('uses flex layout with a scrollable frames pane and fixed drop pane', () => {
		const panel = element.querySelector('.clip-frames-panel');
		const styles = getComputedStyle(panel);
		expect(styles.display).toBe('flex');

		const frames = element.querySelector('clip-frames');
		const framesStyles = getComputedStyle(frames);
		expect(framesStyles.flex).toMatch(/1/);
		expect(framesStyles.overflowX).toBe('auto');

		const dropPane = element.querySelector('.clip-frames-panel-drop');
		const dropStyles = getComputedStyle(dropPane);
		expect(dropStyles.flex).toMatch(/0 0 auto/);
		expect(dropStyles.width).toMatch(/^(8\.5rem|136px)$/); // 8.5rem at 16px root
	});

	test('clears children on disconnect', () => {
		element.remove();
		expect(element.childNodes.length).toBe(0);
	});
});
