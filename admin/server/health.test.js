import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'path';
import { isValidClipId, resolveSafeSpritePath, CLIPS_DIR } from './paths.js';

test('isValidClipId accepts migration ids', () => {
	assert.equal(isValidClipId('c1-n0-v0'), true);
	assert.equal(isValidClipId('neon-skull'), true);
});

test('isValidClipId rejects path traversal and bare numbers', () => {
	assert.equal(isValidClipId('../evil'), false);
	assert.equal(isValidClipId(''), false);
	assert.equal(isValidClipId('5'), false);
	assert.equal(isValidClipId('12'), false);
});

test('resolveSafeSpritePath strips directory components', () => {
	const resolved = resolveSafeSpritePath('neon-skull', '../../../etc/passwd.png');
	assert.equal(resolved, path.join(CLIPS_DIR, 'neon-skull', 'passwd.png'));
});

test('resolveSafeSpritePath rejects invalid names', () => {
	assert.throws(() => resolveSafeSpritePath('neon-skull', '../secret'), /Invalid sprite filename/);
	assert.throws(() => resolveSafeSpritePath('neon-skull', '....png'), /Invalid sprite filename/);
});
