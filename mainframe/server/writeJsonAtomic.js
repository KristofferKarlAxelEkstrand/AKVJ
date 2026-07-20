import fs from 'fs/promises';
import path from 'path';

/**
 * Write a JSON file atomically by writing to a temporary file in the same directory
 * and then renaming it over the target path.
 *
 * @param {string} targetPath
 * @param {any} value
 */
export async function writeJsonAtomic(targetPath, value) {
	const jsonString = `${JSON.stringify(value, null, '\t')}\n`;
	const tempPath = `${targetPath}.tmp.${Date.now()}.${Math.random().toString(36).slice(2)}`;

	await fs.mkdir(path.dirname(targetPath), { recursive: true });
	await fs.writeFile(tempPath, jsonString, 'utf8');
	await fs.rename(tempPath, targetPath);
}
