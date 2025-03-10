import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { log } from 'console';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const aniPath = path.join(__dirname, './src/public/animations');
const outputFilePath = path.join(__dirname, './src/public/animations/animations.json');

// Function to get subfolders
const getSubfolders = dir => fs.readdirSync(dir).filter(file => fs.statSync(path.join(dir, file)).isDirectory());

// Function to get files with specific extension
const getFilesWithExtension = (dir, ext) => fs.readdirSync(dir).filter(file => path.extname(file) === ext);

// Generate JSON
const generateAnimationsJson = () => {
	console.log(`Building animation JSON file from ${aniPath}`);
	const outputObj = {};

	getSubfolders(aniPath).forEach(channel => {
		const channelPath = path.join(aniPath, channel);
		console.log('--- --- --- --- --- --- ---');
		console.log('Channel           ', channel, ' ', ' ', ' ', channelPath);
		outputObj[channel] = {};
		console.log('outputObj', outputObj);

		getSubfolders(channelPath).forEach(note => {
			const notePath = path.join(aniPath, channel, note);
			console.log('Note              ', channel, note, ' ', ' ', notePath);
			outputObj[channel][note] = {};
			console.log('outputObj', outputObj);

			getSubfolders(notePath).forEach(velocityLayer => {
				const velocityLayerPath = path.join(aniPath, channel, note, velocityLayer);
				console.log('Velocity layer    ', channel, note, velocityLayer, ' ', velocityLayerPath);
				outputObj[channel][note][velocityLayer] = {};
				console.log('outputObj', outputObj);

				const pngFile = getFilesWithExtension(velocityLayerPath, '.png')[0];
				const jsonFile = getFilesWithExtension(velocityLayerPath, '.json')[0];

				let jsonContent = {};
				if (jsonFile) {
					const jsonFilePath = path.join(velocityLayerPath, jsonFile);
					const jsonData = fs.readFileSync(jsonFilePath, 'utf8');
					jsonContent = JSON.parse(jsonData);
				}

				outputObj[channel][note][velocityLayer] = { png: pngFile, ...jsonContent };
			});
		});
	});

	const jsonContent = JSON.stringify(outputObj, null, 3);
	fs.writeFileSync(outputFilePath, jsonContent, 'utf8');
	console.log(`JSON file has been saved to ${outputFilePath}`);
};

// Run the function
generateAnimationsJson();
