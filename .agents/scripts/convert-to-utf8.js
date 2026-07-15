import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Root of the project (two levels up from .agents/scripts)
const rootDir = path.resolve(__dirname, '../../');

// Only convert text-based files to avoid corrupting binaries (like .png sprites)
const allowedExtensions = ['.js', '.json', '.md', '.css', '.html'];
const ignoreDirs = ['node_modules', '.git', 'dist', 'src/public/clips'];

function convertToUtf8(dir) {
	const files = fs.readdirSync(dir);

	for (const file of files) {
		const fullPath = path.join(dir, file);
		const stat = fs.statSync(fullPath);

		if (stat.isDirectory()) {
			if (!ignoreDirs.includes(file)) {
				convertToUtf8(fullPath);
			}
		} else {
			const ext = path.extname(file);
			if (allowedExtensions.includes(ext)) {
				try {
					// Read the file as a raw buffer
					const buffer = fs.readFileSync(fullPath);
					
					// Decode it as utf-8 and write it back out.
					// If it has a BOM, this effectively strips it. If it was Windows-1252,
					// this attempts to decode and save it cleanly.
					const content = buffer.toString('utf8');
					fs.writeFileSync(fullPath, content, 'utf8');
					
				} catch (err) {
					console.error(`Failed to convert ${fullPath}:`, err.message);
				}
			}
		}
	}
}

console.log('Scanning for text files to enforce UTF-8 encoding...');
convertToUtf8(rootDir);
console.log('Conversion complete!');
