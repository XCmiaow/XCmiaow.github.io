import astro from 'eslint-plugin-astro';
import tsParser from '@typescript-eslint/parser';

export default [
  // Astro files: use astro-eslint-parser
  ...astro.configs['flat/recommended'],
  {
    files: ['src/**/*.astro'],
    processor: 'astro/client-side-ts',
    rules: {
      'astro/no-conflict-set-directives': 'error',
    },
  },

  // JS/TS files: standard rules
  {
    files: ['src/**/*.{js,ts,mjs}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
      'prefer-const': 'error',
    },
  },

  // Ignored paths
  {
    ignores: ['dist/', 'node_modules/', '.astro/', 'public/', 'scripts/', '*.config.*'],
  },
];
