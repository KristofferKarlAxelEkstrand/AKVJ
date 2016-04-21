// vite.config.js
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
	root: './src',
	build: {
		outDir: path.resolve(__dirname, 'dist'),
		rollupOptions: {
			input: path.resolve(__dirname, 'src/index.html'),
		},
	},
});
