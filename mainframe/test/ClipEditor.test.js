// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import '../src/js/ClipEditor.js';

const mockClip = {
	clipId: 'c1-n0-v0',
	meta: {
		name: 'Test Clip',
		frames: 12,
		numberOfFrames: 12,
		framesPerRow: 4,
		playback: 'loop',
		png: 'sprite.png',
		retrigger: true,
		role: '',
		bitDepth: 0,
		frameRatesForFrames: { 0: 15 },
		frameDurationBeats: null
	}
};

describe('AkvjClipEditor', () => {
	/** @type {import('../src/js/ClipEditor.js').default} */
	let element;

	beforeEach(() => {
		element = document.createElement('akvj-clip-editor');
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
		vi.restoreAllMocks();
	});

	test('renders nothing when no clip is set', () => {
		expect(element.children.length).toBe(0);
	});

	test('renders form when clip is set', () => {
		element.clip = mockClip;
		expect(element.querySelector('.clip-edit-form')).not.toBeNull();
	});

	test('renders name input with correct value', () => {
		element.clip = mockClip;
		const nameInput = element.querySelector('input[name="name"]');
		expect(nameInput).not.toBeNull();
		expect(nameInput.value).toBe('Test Clip');
	});

	test('renders playback select with all modes', () => {
		element.clip = mockClip;
		const playbackSelect = element.querySelector('select[name="playback"]');
		expect(playbackSelect).not.toBeNull();
		const options = Array.from(playbackSelect.options).map(opt => opt.value);
		expect(options).toEqual(['once', 'loop', 'pingpong', 'random', 'reverse', 'shuffle', 'scrub']);
	});

	test('selects the correct playback mode', () => {
		element.clip = mockClip;
		const playbackSelect = element.querySelector('select[name="playback"]');
		expect(playbackSelect.value).toBe('loop');
	});

	test('renders png input with default sprite.png', () => {
		element.clip = mockClip;
		const pngInput = element.querySelector('input[name="png"]');
		expect(pngInput.value).toBe('sprite.png');
	});

	test('renders retrigger checkbox checked when true', () => {
		element.clip = mockClip;
		const retriggerInput = element.querySelector('input[name="retrigger"]');
		expect(retriggerInput.checked).toBe(true);
	});

	test('renders save button', () => {
		element.clip = mockClip;
		const saveButton = Array.from(element.querySelectorAll('button')).find(btn => btn.textContent === 'Save metadata');
		expect(saveButton).not.toBeUndefined();
	});

	test('dispatches clipsaved event on successful save', async () => {
		element.clip = mockClip;

		global.fetch = vi.fn().mockResolvedValue({
			ok: true,
			json: async () => ({ ok: true, clipId: 'c1-n0-v0', meta: mockClip.meta })
		});

		let savedEvent = null;
		element.addEventListener('clipsaved', event => {
			savedEvent = event;
		});

		const saveButton = Array.from(element.querySelectorAll('button')).find(btn => btn.textContent === 'Save metadata');
		saveButton.click();

		await new Promise(resolve => setTimeout(resolve, 0));

		expect(savedEvent).not.toBeNull();
		expect(savedEvent.detail.clipId).toBe('c1-n0-v0');
	});

	test('shows error status on failed save', async () => {
		element.clip = mockClip;

		global.fetch = vi.fn().mockResolvedValue({
			ok: false,
			status: 400,
			json: async () => ({ error: 'Invalid meta' })
		});

		const saveButton = Array.from(element.querySelectorAll('button')).find(btn => btn.textContent === 'Save metadata');
		saveButton.click();

		await new Promise(resolve => setTimeout(resolve, 0));

		const statusSpan = element.querySelector('.status');
		expect(statusSpan.textContent).toContain('Invalid meta');
		expect(statusSpan.classList.contains('is-err')).toBe(true);
	});

	test('renders frameRatesForFrames textarea with JSON content', () => {
		element.clip = mockClip;
		const frameRatesTextarea = element.querySelector('textarea[name="frameRatesForFrames"]');
		expect(frameRatesTextarea).not.toBeNull();
		expect(frameRatesTextarea.value).toBe(JSON.stringify({ 0: 15 }));
	});

	test('cleans up on disconnect', () => {
		element.clip = mockClip;
		element.remove();
		expect(element.children.length).toBe(0);
	});
});
