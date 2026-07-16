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
const ignoreDirs = ['node_modules', '.git', 'dist', 'clips'];

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
					// Read the file as utf-8
					const content = fs.readFileSync(fullPath, 'utf8');

					// Check for UTF-8 Byte Order Mark (BOM)
					if (content.charCodeAt(0) === 0xFEFF) {
						// Strip the BOM and write back
						fs.writeFileSync(fullPath, content.slice(1), 'utf8');
						console.log(`Stripped BOM from: ${fullPath}`);
					}
				} catch (err) {
					console.error(`Failed to process ${fullPath}:`, err.message);
				}
			}
		}
	}
}

console.log('Scanning for text files to enforce UTF-8 encoding...');
convertToUtf8(rootDir);
console.log('Conversion complete!');
