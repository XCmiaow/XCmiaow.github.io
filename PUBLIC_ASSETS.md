# Public Asset Boundary

This repository publishes a sanitized resume website. Keep formal application packets and identity-heavy files local unless they have been explicitly reviewed for public release.

## Public routes

- `/`, `/en/`
- `/materials`, `/en/materials`
- `/resume-onepage`, `/en/resume-onepage`
- `/resume-academic`, `/en/resume-academic`
- `/resume-career`, `/en/resume-career`
- `/evidence`, `/en/evidence`
- `/modeling`, `/en/modeling`
- `/chem-ai-lab`, `/en/chem-ai-lab`
- `/blog`, `/en/blog`

## Restricted public evidence

The evidence gallery is curated for public review, but certificate images should still be checked before sharing a link widely. Do not add complete proof packets, raw scans, or private identity files to public evidence folders.

## Local-only materials

- Root-level PDF exports, including formal application PDFs.
- `src/pages/resume-sioc-summer.astro` until it is sanitized and approved for publication.
- Scripts that merge or generate full proof/application packets.
- `assets/evidence/private/`
- `public/assets/evidence/private/`

## Publish rule

Public routes must not expose phone numbers, birth dates, student IDs, complete proof bundles, or links to local-only application packets. Root-level PDFs are ignored by default; only reviewed assets under `public/` should be published.
