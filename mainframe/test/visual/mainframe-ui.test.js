import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import '../../src/js/ClipList.js';
import '../../src/js/MappingTable.js';
import '../../src/js/PianoRoll.js';
import '../../src/js/KeyBed.js';
import '../../src/js/PianoKey.js';

/**
 * Visual regression tests for the Mainframe UI custom elements.
 * These tests run in real Chromium via Vitest browser mode with Playwright.
 * Elements are instantiated with mock data and screenshots are compared
 * against baselines in test/visual/__screenshots__/.
 *
 * Run:  npm run test:visual -w mainframe
 * Update baselines:  npm run test:visual:update -w mainframe
 */

const mockClips = [
	{
		clipId: 'c1-n0-v0',
		meta: { name: 'Test Clip Alpha', frames: 12, framesPerRow: 4, role: '', playback: 'loop' },
		hasSprite: false,
		pipelineReady: true
	},
	{
		clipId: 'c1-n1-v0',
		meta: { name: 'Test Clip Beta', frames: 8, framesPerRow: 8, role: 'bitmask', playback: 'once', bitDepth: 1 },
		hasSprite: false,
		pipelineReady: true
	},
	{
		clipId: 'c1-n2-v0',
		meta: { name: 'Incomplete Clip', frames: 4, framesPerRow: 2 },
		hasSprite: false,
		pipelineReady: false
	}
];

const mockMappingEntries = [
	{ channel: 1, note: 0, velocity: 0, clipId: 'c1-n0-v0' },
	{ channel: 1, note: 1, velocity: 0, clipId: 'c1-n1-v0' },
	{ channel: 6, note: 0, velocity: 0, clipId: 'c1-n2-v0' }
];

/** Seeded on low note numbers so velocity bands appear in the left of an 800px crop. */
const mockPianoRollMappings = [
	{ channel: 1, note: 0, velocity: 0, clipId: 'c1-n0-v0' },
	{ channel: 1, note: 0, velocity: 64, clipId: 'c1-n1-v0' },
	{ channel: 1, note: 1, velocity: 0, clipId: 'c1-n1-v0' },
	{ channel: 1, note: 2, velocity: 0, clipId: 'c1-n2-v0' },
	{ channel: 1, note: 2, velocity: 40, clipId: 'c1-n0-v0' },
	{ channel: 1, note: 2, velocity: 90, clipId: 'c1-n1-v0' }
];

const mockClipCatalog = mockClips;

let container;

beforeEach(() => {
	container = document.createElement('div');
	container.style.width = '800px';
	container.style.padding = '16px';
	container.style.backgroundColor = '#1a1a2e';
	container.style.color = '#e0e0e0';
	container.style.fontFamily = 'sans-serif';
	document.body.appendChild(container);
});

afterEach(() => {
	if (container && container.parentNode) {
		container.parentNode.removeChild(container);
	}
	container = null;
});

describe('ClipList visual tests', () => {
	test('clip list with multiple clips', async () => {
		const clipList = document.createElement('akvj-clip-list');
		clipList.style.display = 'block';
		clipList.style.minHeight = '200px';
		container.appendChild(clipList);
		clipList.clips = mockClips;

		await expect(clipList).toMatchScreenshot('mainframe-clip-list');
	});

	test('clip list empty state', async () => {
		const clipList = document.createElement('akvj-clip-list');
		clipList.style.display = 'block';
		clipList.style.minHeight = '100px';
		container.appendChild(clipList);
		clipList.clips = [];

		await expect(clipList).toMatchScreenshot('mainframe-clip-list-empty');
	});

	test('clip list with search filter active', async () => {
		const clipList = document.createElement('akvj-clip-list');
		clipList.style.display = 'block';
		clipList.style.minHeight = '200px';
		container.appendChild(clipList);
		clipList.clips = mockClips;
		clipList.searchQuery = 'alpha';

		await expect(clipList).toMatchScreenshot('mainframe-clip-list-filtered');
	});
});

describe('MappingTable visual tests', () => {
	test('mapping table with entries', async () => {
		const mappingTable = document.createElement('akvj-mapping-table');
		mappingTable.style.display = 'block';
		mappingTable.style.minHeight = '200px';
		container.appendChild(mappingTable);
		mappingTable.mappings = mockMappingEntries;
		mappingTable.clipCatalog = mockClipCatalog;

		await expect(mappingTable).toMatchScreenshot('mainframe-mapping-table');
	});

	test('mapping table empty state', async () => {
		const mappingTable = document.createElement('akvj-mapping-table');
		mappingTable.style.display = 'block';
		mappingTable.style.minHeight = '100px';
		container.appendChild(mappingTable);
		mappingTable.mappings = [];
		mappingTable.clipCatalog = mockClipCatalog;

		await expect(mappingTable).toMatchScreenshot('mainframe-mapping-table-empty');
	});
});

describe('PianoRoll visual tests', () => {
	test('piano roll edit mode with velocity bands', async () => {
		const pianoRoll = document.createElement('piano-roll');
		pianoRoll.setAttribute('mode', 'edit');
		pianoRoll.setAttribute('channel', '1');
		pianoRoll.setAttribute('channel-select', '');
		pianoRoll.style.display = 'block';
		pianoRoll.style.width = '800px';
		pianoRoll.style.minHeight = '220px';
		container.appendChild(pianoRoll);
		pianoRoll.clips = mockClips;
		pianoRoll.mappings = mockPianoRollMappings;

		await expect(pianoRoll).toMatchScreenshot('mainframe-piano-roll-edit');
	});

	test('piano roll filter mode with filter chrome', async () => {
		const pianoRoll = document.createElement('piano-roll');
		pianoRoll.setAttribute('mode', 'filter');
		pianoRoll.setAttribute('channel', '1');
		pianoRoll.setAttribute('channel-select', '');
		pianoRoll.style.display = 'block';
		pianoRoll.style.width = '800px';
		pianoRoll.style.minHeight = '220px';
		container.appendChild(pianoRoll);
		pianoRoll.clips = mockClips;
		pianoRoll.mappings = mockPianoRollMappings;

		await expect(pianoRoll).toMatchScreenshot('mainframe-piano-roll-filter');
	});

	test('piano roll play mode with velocity slider and empty preview', async () => {
		const pianoRoll = document.createElement('piano-roll');
		pianoRoll.setAttribute('mode', 'play');
		pianoRoll.setAttribute('channel', '1');
		pianoRoll.setAttribute('channel-select', '');
		pianoRoll.style.display = 'block';
		pianoRoll.style.width = '800px';
		pianoRoll.style.minHeight = '280px';
		container.appendChild(pianoRoll);
		pianoRoll.clips = mockClips;
		pianoRoll.mappings = mockPianoRollMappings;

		await expect(pianoRoll).toMatchScreenshot('mainframe-piano-roll-play');
	});
});
