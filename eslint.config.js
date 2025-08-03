import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  prettier,
  {
    // Exclude generated directories from linting
    ignores: [
      'dist/**/*',
      'dev-dist/**/*',
      'node_modules/**/*',
    ],
  },
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        PIXI: 'readonly',
        localStorage: 'readonly',
        setTimeout: 'readonly',
        requestAnimationFrame: 'readonly',
        eval: 'readonly',
        // Service Worker globals
        self: 'readonly',
        navigator: 'readonly',
        importScripts: 'readonly',
        WorkerGlobalScope: 'readonly',
      },
    },
  },
];