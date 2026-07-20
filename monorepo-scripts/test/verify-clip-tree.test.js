import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { describe, test, expect } from 'vitest';
import { missingArtifacts } from '../verify-clip-tree.js';

describe('missingArtifacts', () => {
	test('returns empty when every required path exists', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akvj-clip-tree-'));
		const a = path.join(dir, 'projects', 'index.json');
		const b = path.join(dir, 'active-project.json');
		fs.mkdirSync(path.dirname(a), { recursive: true });
		fs.writeFileSync(a, '{}');
		fs.writeFileSync(b, '"default"');
		try {
			expect(missingArtifacts([a, b])).toEqual([]);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	test('lists every absent artifact', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akvj-clip-tree-'));
		const a = path.join(dir, 'projects', 'index.json');
		const b = path.join(dir, 'active-project.json');
		try {
			expect(missingArtifacts([a, b])).toEqual([a, b]);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});

	test('lists only the missing one when the other is present', () => {
		const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'akvj-clip-tree-'));
		const a = path.join(dir, 'projects', 'index.json');
		const b = path.join(dir, 'active-project.json');
		fs.mkdirSync(path.dirname(a), { recursive: true });
		fs.writeFileSync(a, '{}');
		try {
			expect(missingArtifacts([a, b])).toEqual([b]);
		} finally {
			fs.rmSync(dir, { recursive: true, force: true });
		}
	});
});

describe('verify-clip-tree CLI', () => {
	const script = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'verify-clip-tree.js');

	test('exits 0 when the repo clip tree is present', () => {
		// In this working tree the clip pipeline has run, so the CLI's real
		// REQUIRED_PATHS resolve and it should exit 0. The missing-artifact
		// branch is covered by missingArtifacts() above; the CLI is glue.
		const result = spawnSync(process.execPath, [script], { encoding: 'utf8' });
		expect(result.status).toBe(0);
	});
});
