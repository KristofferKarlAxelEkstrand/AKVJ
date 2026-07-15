import fs from 'fs/promises';
import path from 'path';

/**
 * Recursively get all files in a directory.
 * @param {string} dir - Directory to scan
 * @param {string} [base] - Base path for relative paths
 * @returns {Promise<string[]>} List of relative file paths
 */
async function getAllFiles(dir, base = dir) {
	const files = [];

	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			const fullPath = path.join(dir, entry.name);
			const relativePath = path.relative(base, fullPath);

			if (entry.isDirectory()) {
				const subFiles = await getAllFiles(fullPath, base);
				files.push(...subFiles);
			} else {
				files.push(relativePath);
			}
		}
	} catch {
		// Directory doesn't exist
	}

	return files;
}

/**
 * Check if two files have the same content.
 * @param {string} file1 - First file path
 * @param {string} file2 - Second file path
 * @returns {Promise<boolean>} True if contents match
 */
async function filesMatch(file1, file2) {
	try {
		const [content1, content2] = await Promise.all([fs.readFile(file1), fs.readFile(file2)]);
		return content1.equals(content2);
	} catch {
		return false;
	}
}

/**
 * Sync files from cache to public folder.
 * Only copies changed files, removes orphaned files.
 * @param {string} cacheDir - Source cache directory
 * @param {string} publicDir - Destination public directory
 * @returns {Promise<{copied: number, skipped: number, removed: number}>}
 */
export async function copyToPublic(cacheDir, publicDir) {
	const stats = { copied: 0, skipped: 0, removed: 0 };

	// Get all files from cache (excluding .hash files)
	const cacheFiles = (await getAllFiles(cacheDir)).filter(f => !f.endsWith('.hash'));

	// Get all files from public
	const publicFiles = await getAllFiles(publicDir);

	// Copy new/changed files
	for (const file of cacheFiles) {
		const srcPath = path.join(cacheDir, file);
		const destPath = path.join(publicDir, file);

		// Check if file exists and matches
		if (await filesMatch(srcPath, destPath)) {
			stats.skipped++;
			continue;
		}

		// Copy file
		await fs.mkdir(path.dirname(destPath), { recursive: true });
		await fs.copyFile(srcPath, destPath);
		stats.copied++;
	}

	// Remove orphaned files (in public but not in cache)
	const cacheFileSet = new Set(cacheFiles);
	for (const file of publicFiles) {
		// Skip LICENSE files
		if (file.includes('LICENSE')) {
			continue;
		}

		if (!cacheFileSet.has(file)) {
			const filePath = path.join(publicDir, file);
			await fs.unlink(filePath);
			stats.removed++;
		}
	}

	// Clean up empty directories
	await removeEmptyDirs(publicDir);

	return stats;
}

/**
 * Recursively remove empty directories.
 * @param {string} dir - Directory to clean
 */
async function removeEmptyDirs(dir) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true });

		for (const entry of entries) {
			if (entry.isDirectory()) {
				await removeEmptyDirs(path.join(dir, entry.name));
			}
		}

		// Check if directory is now empty
		const remaining = await fs.readdir(dir);
		if (remaining.length === 0) {
			await fs.rmdir(dir);
		}
	} catch {
		// Ignore errors
	}
}

/**
 * Clean cache and public directories.
 * @param {string} cacheDir - Cache directory to remove
 * @param {string} publicDir - Public directory to clean (removes only generated files)
 */
export async function clean(cacheDir, publicDir) {
	// Remove entire cache directory
	await fs.rm(cacheDir, { recursive: true, force: true });
	console.log(`Removed ${cacheDir}`);

	// Remove generated files from public (keep LICENSE)
	try {
		const files = await getAllFiles(publicDir);
		for (const file of files) {
			if (!file.includes('LICENSE')) {
				await fs.unlink(path.join(publicDir, file));
			}
		}
		await removeEmptyDirs(publicDir);
		console.log(`Cleaned ${publicDir}`);
	} catch {
		// Directory might not exist
	}
}
