import js from '@eslint/js';
import astro from 'eslint-plugin-astro';

export default [
  js.configs.recommended,
  ...astro.configs['flat/recommended'],
  {
    files: ['src/**/*.{js,ts,mjs}'],
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/', '.astro/', 'public/', 'scripts/'],
  },
];
