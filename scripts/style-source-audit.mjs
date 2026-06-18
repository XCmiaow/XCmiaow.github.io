import fs from 'node:fs';
import path from 'node:path';
import { styleSources } from './generate-site-css.mjs';

const root = process.cwd();
const publicRoutes = [
  'src/pages/index.astro',
  'src/pages/en/index.astro',
  'src/pages/modeling.astro',
  'src/pages/en/modeling.astro',
  'src/pages/ai-km.astro',
  'src/pages/en/ai-km.astro',
  'src/pages/chem-ai-lab.astro',
  'src/pages/en/chem-ai-lab.astro',
  'src/pages/evidence.astro',
  'src/pages/en/evidence.astro',
  'src/pages/materials.astro',
  'src/pages/en/materials.astro',
  'src/pages/resume-onepage.astro',
  'src/pages/en/resume-onepage.astro',
  'src/pages/resume-academic.astro',
  'src/pages/en/resume-academic.astro',
  'src/pages/resume-career.astro',
  'src/pages/en/resume-career.astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/en/blog/index.astro',
  'src/pages/en/blog/[slug].astro',
];
const renderedComponents = [
  'src/layouts/BaseLayout.astro',
  'src/layouts/PrintLayout.astro',
  'src/components/CompetitionTimeline.astro',
  'src/components/Gallery3D.astro',
  'src/components/Lightbox.astro',
  'src/components/Molecule3D.astro',
  'src/components/ParticlesBackground.astro',
  'src/components/CursorGlow.astro',
];
const allowedExternalStyles = new Set([
  'src/pages/chem-ai-lab.astro',
  'src/pages/en/chem-ai-lab.astro',
  'src/pages/blog/index.astro',
  'src/pages/blog/[slug].astro',
  'src/pages/en/blog/index.astro',
  'src/pages/en/blog/[slug].astro',
  'src/components/Gallery3D.astro',
]);

function hasStyleBlock(source) {
  const file = path.join(root, source);
  return fs.existsSync(file) && /<style\b/i.test(fs.readFileSync(file, 'utf8'));
}

function assertExisting(source, failures) {
  if (!fs.existsSync(path.join(root, source))) failures.push(`Configured style source does not exist: ${source}`);
}

const failures = [];
const sourceSet = new Set(styleSources);
styleSources.forEach((source) => assertExisting(source, failures));

for (const source of [...publicRoutes, ...renderedComponents]) {
  if (!hasStyleBlock(source)) continue;
  if (sourceSet.has(source)) continue;
  if (allowedExternalStyles.has(source)) continue;
  failures.push(`Styled public surface is missing from stable CSS sources: ${source}`);
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ failures: [], checked: styleSources.length }, null, 2));
