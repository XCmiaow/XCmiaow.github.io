# Public Asset Boundary

This repository publishes a sanitized resume website. Keep formal application packets and identity-heavy files local unless they have been explicitly reviewed for public release.

## Public routes

- `/`, `/en/` (brand home)
- `/profile`, `/en/profile`
- `/silicon-ashes/writing/`, `/en/silicon-ashes/writing/`
- `/silicon-ashes/resources/`, `/en/silicon-ashes/resources/`
- `/silicon-ashes/courses/`, `/en/silicon-ashes/courses/`
- `/silicon-ashes/courses/ai-research-efficiency/` (Chinese full course)
- `/en/silicon-ashes/courses/ai-research-efficiency/` (English notice/entry)
- `/silicon-ashes/about/`, `/en/silicon-ashes/about/`
- `/materials`, `/en/materials`
- `/resume-onepage`, `/en/resume-onepage`
- `/resume-academic`, `/en/resume-academic`
- `/resume-career`, `/en/resume-career`
- `/evidence`, `/en/evidence`
- `/modeling`, `/en/modeling`
- `/chem-ai-lab`, `/en/chem-ai-lab`
- `/blog`, `/en/blog` (compatibility only; no duplicate canonical content)

## Restricted public evidence

The evidence gallery is curated for public review, but certificate images should still be checked before sharing a link widely. Do not add complete proof packets, raw scans, or private identity files to public evidence folders.

## Local-only materials

- Root-level PDF exports, including formal application PDFs.
- `local-only/pages/resume-sioc-summer.astro` until it is sanitized and approved for publication.
- Scripts that merge or generate full proof/application packets.
- Temporary packet build output under `.tmp-visual/`.
- `assets/evidence/private/`
- `public/assets/evidence/private/`

## Publish rule

Public routes must not expose phone numbers, birth dates, student IDs, complete proof bundles, or links to local-only application packets. Formal packet source pages should not live in `src/pages/` because Astro will publish every page in that directory. Root-level PDFs are ignored by default; only reviewed assets under `public/` should be published.
