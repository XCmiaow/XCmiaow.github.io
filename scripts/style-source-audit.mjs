import fs from 'node:fs';
import path from 'node:path';
import { collectSiteCss, styleSources } from './generate-site-css.mjs';

const root = process.cwd();
const failures = [];

for (const source of styleSources) {
  if (!source.endsWith('.css')) failures.push(`Stable stylesheet source must be CSS, not component markup: ${source}`);
  if (!fs.existsSync(path.join(root, source))) failures.push(`Configured style source does not exist: ${source}`);
}

const generatedPath = path.join(root, 'public', 'styles', 'site.css');
if (!fs.existsSync(generatedPath)) {
  failures.push('Generated stylesheet is missing: public/styles/site.css');
} else {
  const committed = fs.readFileSync(generatedPath, 'utf8');
  const expected = collectSiteCss(root);
  if (committed !== expected) failures.push('public/styles/site.css is stale; run node scripts/generate-site-css.mjs');
}

if (failures.length) {
  console.error(JSON.stringify({ failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ failures: [], checked: styleSources.length }, null, 2));
