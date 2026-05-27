# Xujie Fang · Academic Resume Website

[![MIT License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Astro](https://img.shields.io/badge/built%20with-Astro-ff5a03)](https://astro.build)
[![GitHub Pages](https://img.shields.io/badge/deployed%20on-GitHub%20Pages-222)](https://pages.github.com)

> Personal academic resume website built with Astro. Bilingual Chinese/English, data-driven, PWA-enabled.

**Live site → https://XCmiaow.github.io**

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Astro 5.x (static output) |
| Styling | CSS custom properties + generated site.css |
| Data | JSON-driven (src/data/) |
| Deployment | GitHub Actions to GitHub Pages |
| Offline | Service Worker + APP_SHELL |
| License | MIT |

## Project Structure

```
/
├── src/
│   ├── pages/           # Page routes (/, /en/, /chem-ai-lab, etc.)
│   ├── components/      # Reusable components (7 atomic + 4 effects)
│   ├── layouts/         # BaseLayout + PrintLayout
│   ├── data/            # zh.json, en.json, common.json, i18n.json
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Helper functions (URL, i18n)
│   └── styles/          # CSS source files
├── public/              # Static assets, site.css, sw.js, manifest.json
├── scripts/             # Build scripts (CSS generation, QA check)
├── CLAUDE.md            # Project spec for AI agents
└── LICENSE
```

## Features

- **Bilingual** — Chinese at `/`, English at `/en/`, language preference memory
- **Dark mode** — Persisted toggle via CSS custom properties
- **Responsive** — 3 breakpoints, mobile hamburger menu, landscape support
- **PWA** — Add to home screen, offline cache via Service Worker
- **Print** — Strict one-page A4 resume with dedicated PrintLayout
- **Animations** — Scroll reveal, typewriter hero, particle starfield, cursor glow, 3D tilt card
- **Interactive timeline** — Filterable competition timeline with expandable detail cards
- **Lightbox** — Certificate image viewer with keyboard navigation
- **Data-driven** — All content from JSON, UI labels from i18n.json
- **CI/CD** — Auto build + deploy on git push via GitHub Actions

## Quick Start

```bash
npm install
npm run dev      # localhost:4321
npm run build    # production build
```

## Data Architecture

```
zh.json / en.json  →  Page frontmatter  →  Component props  →  Render
common.json        →  Shared: GPA, email, GitHub, project tags
i18n.json          →  BaseLayout: nav, footer, CTA labels
```

## Adding a Page

1. Add content to `zh.json` and `en.json`
2. Create `.astro` in `src/pages/`
3. Wrap with `BaseLayout` (set `lang`)
4. Add shared data to `common.json`
5. Update `BaseLayout` nav and `i18n.json` if needed
6. Update `public/sw.js` APP_SHELL cache list

## Deployment

```bash
git push origin main
# GitHub Actions auto-builds and deploys
```

## License

MIT © 2026 Xujie Fang
