import fs from 'fs/promises';
import path from 'path';

/**
 * Get all subdirectories of a directory.
 * @param {string} dir - Directory path
 * @returns {Promise<string[]>} List of subdirectory names
 */
export async function getSubfolders(dir) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });
		return entries.filter(e => e.isDirectory()).map(e => e.name);
	} catch {
		// Directory doesn't exist or can't be read - return empty array
		return [];
	}
}

/**
 * Get files with a specific extension in a directory.
 * @param {string} dir - Directory path
 * @param {string} ext - Extension including dot (e.g., '.png')
 * @returns {Promise<string[]>} List of matching filenames
 */
export async function getFilesWithExtension(dir, ext) {
	try {
		const entries = await fs.readdir(dir);
		return entries.filter(f => path.extname(f) === ext);
	} catch {
		// Directory doesn't exist or can't be read - return empty array
		return [];
	}
}
