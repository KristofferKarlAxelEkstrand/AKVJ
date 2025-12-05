import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
js.configs.recommended,
prettier,
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
{
files: ['*.config.js', 'generateAnimationsJson.js'],
languageOptions: {
globals: {
...globals.node
}
}
},
{
ignores: ['dist/**', 'node_modules/**', 'src/public/**']
}
];
