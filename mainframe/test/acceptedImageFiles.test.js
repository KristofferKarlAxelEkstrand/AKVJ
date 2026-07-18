import { describe, expect, it } from 'vitest';
import {
	ACCEPTED_IMAGE_ACCEPT,
	ACCEPTED_IMAGE_LABEL,
	formatSkippedFilesMessage,
	getFileExtension,
	isAcceptedImageFile,
	isGifFile,
	partitionImageFiles,
	shouldAttemptGifExpand
} from '../src/js/acceptedImageFiles.js';

function fakeFile(name, type) {
	return { name, type };
}

describe('acceptedImageFiles', () => {
	it('exports accept attribute covering png/jpeg/gif', () => {
		expect(ACCEPTED_IMAGE_ACCEPT).toContain('image/png');
		expect(ACCEPTED_IMAGE_ACCEPT).toContain('image/jpeg');
		expect(ACCEPTED_IMAGE_ACCEPT).toContain('image/gif');
		expect(ACCEPTED_IMAGE_LABEL).toMatch(/PNG/);
	});

	it('getFileExtension returns lowercase extension with dot', () => {
		expect(getFileExtension('Frame.PNG')).toBe('.png');
		expect(getFileExtension('noext')).toBe('');
	});

	it('accepts PNG/JPG/GIF by MIME', () => {
		expect(isAcceptedImageFile(fakeFile('a.png', 'image/png'))).toBe(true);
		expect(isAcceptedImageFile(fakeFile('a.jpg', 'image/jpeg'))).toBe(true);
		expect(isAcceptedImageFile(fakeFile('a.gif', 'image/gif'))).toBe(true);
	});

	it('accepts by extension when MIME is empty', () => {
		expect(isAcceptedImageFile(fakeFile('still.JPEG', ''))).toBe(true);
		expect(isAcceptedImageFile(fakeFile('still.gif', ''))).toBe(true);
	});

	it('rejects unsupported types', () => {
		expect(isAcceptedImageFile(fakeFile('clip.mp4', 'video/mp4'))).toBe(false);
		expect(isAcceptedImageFile(fakeFile('photo.heic', 'image/heic'))).toBe(false);
		expect(isAcceptedImageFile(fakeFile('notes.txt', 'text/plain'))).toBe(false);
		expect(isAcceptedImageFile(null)).toBe(false);
	});

	it('partitionImageFiles separates accepted and rejected', () => {
		const files = [fakeFile('a.png', 'image/png'), fakeFile('b.webp', 'image/webp'), fakeFile('c.jpg', 'image/jpeg')];
		const { accepted, rejected } = partitionImageFiles(files);
		expect(accepted.map(file => file.name)).toEqual(['a.png', 'c.jpg']);
		expect(rejected.map(file => file.name)).toEqual(['b.webp']);
	});

	it('formatSkippedFilesMessage lists skipped names', () => {
		expect(formatSkippedFilesMessage([])).toBe('');
		expect(formatSkippedFilesMessage([fakeFile('x.webp', 'image/webp')])).toBe('Skipped unsupported file: x.webp');
		expect(formatSkippedFilesMessage([fakeFile('a.mp4', ''), fakeFile('b.heic', '')])).toBe('Skipped unsupported files: a.mp4, b.heic');
	});

	it('detects GIF files and lone-GIF expand batches', () => {
		expect(isGifFile(fakeFile('a.gif', 'image/gif'))).toBe(true);
		expect(isGifFile(fakeFile('a.GIF', ''))).toBe(true);
		expect(isGifFile(fakeFile('a.png', 'image/png'))).toBe(false);
		expect(shouldAttemptGifExpand([fakeFile('solo.gif', 'image/gif')])).toBe(true);
		expect(shouldAttemptGifExpand([fakeFile('a.gif', 'image/gif'), fakeFile('b.gif', 'image/gif')])).toBe(false);
		expect(shouldAttemptGifExpand([fakeFile('a.gif', 'image/gif'), fakeFile('b.png', 'image/png')])).toBe(false);
	});
});
