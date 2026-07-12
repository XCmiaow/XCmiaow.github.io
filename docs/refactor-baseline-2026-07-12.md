# Refactor baseline — 2026-07-12

- Canonical product decision: brand at `/`, resume at `/profile/`.
- Git topology before integration: at the initial audit, `codex/quality-hardening` was 17 commits ahead of `main`; `main` and `origin/main` pointed to `2e8c78b`. The two subsequently committed design and implementation-plan documents increase the ahead count without changing that baseline.
- Valid work to preserve: source, content, docs, reviewed public images, QA scripts, security headers, and package changes.
- Reproducible artifacts to exclude: `.codex-*.png`, `output/`, `.superpowers/`, logs, caches, `dist/`, and generated local reports such as `security_best_practices_report.md`.
- Baseline checks: ESLint passes; Prettier fails in `AboutPage.astro` and `SiliconEmbersFeedPage.astro`; build passes; full check stops at route/tap-target failures.
