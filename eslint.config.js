import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
	js.configs.recommended,
	prettier,
	// Test files override - support test globals and browser globals
	{
		files: ['test/**', '**/*.test.js'],
		languageOptions: {
			globals: {
				...globals.browser,
				beforeEach: true,
				afterEach: true,
				beforeAll: true,
				afterAll: true,
				vi: true,
				describe: true,
				test: true,
				expect: true
			}
		}
	},
	// Main JS config
	{
		languageOptions: {
			ecmaVersion: 'latest',
			sourceType: 'module',
			globals: {
				...globals.browser
			}
		},
		rules: {
			'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
			'no-console': 'off',
			'prefer-const': 'error',
			'no-var': 'error',
			eqeqeq: ['error', 'always'],
			curly: ['error', 'all']
		}
	},
	// Node config for build/dev tools
	{
		files: ['*.config.js', 'generateAnimationsJson.js'],
		languageOptions: {
			globals: {
				...globals.node
			}
		}
	},
	// Ignore artifact folders
	{
		ignores: ['dist/**', 'node_modules/**', 'src/public/**']
	}
];
