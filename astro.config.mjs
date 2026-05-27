import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://XCmiaow.github.io',
  base: '/',
  i18n: {
    defaultLocale: 'zh',
    locales: ['zh', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
  build: {
    assets: 'assets',
  },
});
