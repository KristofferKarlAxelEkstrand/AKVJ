import { createHash } from 'crypto';
import fs from 'fs/promises';

/**
 * Compute SHA256 hash of a file.
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} Hex-encoded hash
 */
export async function hashFile(filePath) {
	const content = await fs.readFile(filePath);
	return createHash('sha256').update(content).digest('hex');
}

/**
 * Read a hash from a sidecar .hash file.
 * @param {string} hashFilePath - Path to the .hash file
 * @returns {Promise<string>} The stored hash
 */
export async function readHashFile(hashFilePath) {
	const content = await fs.readFile(hashFilePath, 'utf8');
	return content.trim();
}

/**
 * Write a hash to a sidecar .hash file.
 * @param {string} hashFilePath - Path to the .hash file
 * @param {string} hash - The hash to write
 */
export async function writeHashFile(hashFilePath, hash) {
	await fs.writeFile(hashFilePath, hash, 'utf8');
}

/**
 * Check if a cached file is up-to-date by comparing source hash with sidecar.
 * @param {string} sourcePath - Path to source file
 * @param {string} cachePath - Path to cached file (hash file is cachePath + '.hash')
 * @returns {Promise<boolean>} True if cache is valid
 */
export async function isCacheValid(sourcePath, cachePath) {
	try {
		const sourceHash = await hashFile(sourcePath);
		const cachedHash = await readHashFile(cachePath + '.hash');
		return sourceHash === cachedHash;
	} catch {
		return false;
	}
}
