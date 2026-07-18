// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import MappingTable from '../src/js/MappingTable.js';

describe('MappingTable', () => {
	/** @type {MappingTable} */
	let element;

	beforeEach(() => {
		element = new MappingTable();
		document.body.append(element);
	});

	afterEach(() => {
		element.remove();
	});

	test('mappings setter renders table rows from mapping entries', () => {
		element.mappings = [
			{ channel: 1, note: 60, velocity: 0, clipId: 'neon-skull' },
			{ channel: 2, note: 0, velocity: 64, clipId: 'logo' }
		];

		const rows = element.querySelectorAll('tbody tr');
		expect(rows).toHaveLength(2);
		expect(rows[0].querySelectorAll('td')[0].textContent).toBe('1');
		expect(rows[0].querySelectorAll('td')[3].textContent).toBe('neon-skull');
		expect(rows[1].querySelectorAll('td')[0].textContent).toBe('2');
		expect(rows[1].querySelectorAll('td')[3].textContent).toBe('logo');
	});

	test('clipCatalog setter re-renders summary with unmapped clips', () => {
		element.mappings = [{ channel: 1, note: 0, velocity: 0, clipId: 'mapped-clip' }];
		element.clipCatalog = [
			{ clipId: 'mapped-clip', pipelineReady: true },
			{ clipId: 'free-clip', pipelineReady: true },
			{ clipId: 'incomplete', pipelineReady: false }
		];

		expect(element.querySelector('.mapping-summary-count').textContent).toBe('1 mapped slot');
		expect(element.querySelector('.mapping-summary-unmapped').textContent).toBe('Unmapped: free-clip');
	});

	test('summary shows plural mapped slots and sorted unmapped list', () => {
		element.mappings = [
			{ channel: 1, note: 0, velocity: 0, clipId: 'a' },
			{ channel: 1, note: 1, velocity: 0, clipId: 'b' }
		];
		element.clipCatalog = [
			{ clipId: 'zeta', pipelineReady: true },
			{ clipId: 'alpha', pipelineReady: true },
			{ clipId: 'a', pipelineReady: true }
		];

		expect(element.querySelector('.mapping-summary-count').textContent).toBe('2 mapped slots');
		expect(element.querySelector('.mapping-summary-unmapped').textContent).toBe('Unmapped: alpha, zeta');
	});

	test('table sorts entries by channel, then note, then velocity', () => {
		element.mappings = [
			{ channel: 2, note: 0, velocity: 0, clipId: 'c2' },
			{ channel: 1, note: 10, velocity: 0, clipId: 'n10' },
			{ channel: 1, note: 0, velocity: 64, clipId: 'v64' },
			{ channel: 1, note: 0, velocity: 0, clipId: 'v0' }
		];

		const clipIds = [...element.querySelectorAll('tbody tr')].map(row => row.querySelectorAll('td')[3].textContent);
		expect(clipIds).toEqual(['v0', 'v64', 'n10', 'c2']);
	});

	test('remove button dispatches mappingremove with entry detail', () => {
		const handler = vi.fn();
		element.addEventListener('mappingremove', handler);
		element.mappings = [{ channel: 3, note: 12, velocity: 80, clipId: 'kick' }];

		element.querySelector('tbody button').click();

		expect(handler).toHaveBeenCalledOnce();
		expect(handler.mock.calls[0][0].detail).toEqual({
			channel: 3,
			note: 12,
			velocity: 80,
			clipId: 'kick'
		});
		expect(handler.mock.calls[0][0].bubbles).toBe(true);
	});

	test('disconnectedCallback clears children', () => {
		element.mappings = [{ channel: 1, note: 0, velocity: 0, clipId: 'x' }];
		expect(element.children.length).toBeGreaterThan(0);

		element.remove();
		expect(element.children).toHaveLength(0);
		expect(element.querySelector('.mapping-summary')).toBeNull();
		expect(element.querySelector('table')).toBeNull();
	});

	test('empty mappings renders empty table and 0 mapped slots summary', () => {
		element.mappings = [];
		element.clipCatalog = [];

		expect(element.querySelector('.mapping-summary-count').textContent).toBe('0 mapped slots');
		expect(element.querySelector('.mapping-summary-unmapped')).toBeNull();
		expect(element.querySelectorAll('tbody tr')).toHaveLength(0);
		expect(element.querySelectorAll('thead th')).toHaveLength(5);
	});
});
