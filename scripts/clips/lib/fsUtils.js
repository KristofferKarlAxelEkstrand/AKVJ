import fs from 'fs/promises';

/**
 * Copy a file, falling back to read/write if the filesystem doesn't support
 * copyFile (e.g., 9p mounts in dev containers return EPERM for copy_file_range).
 * @param {string} src - Source path
 * @param {string} dest - Destination path
 * @returns {Promise<void>}
 */
export async function copyFileWithFallback(src, dest) {
	try {
		await fs.copyFile(src, dest);
	} catch (err) {
		if (err.code === 'EPERM' || err.code === 'ENOSYS') {
			const fileContents = await fs.readFile(src);
			await fs.writeFile(dest, fileContents);
		} else {
			throw err;
		}
	}
}
