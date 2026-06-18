import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const source = path.join(root, 'src', 'tools', 'write.astro');
const publicRoute = path.join(root, 'src', 'pages', 'write.astro');

const action = process.argv[2] || 'disable';

if (!['enable', 'disable'].includes(action)) {
  console.error('Usage: node scripts/write-route.mjs <enable|disable>');
  process.exit(1);
}

if (action === 'enable') {
  if (!fs.existsSync(source)) {
    console.error('Missing local write tool source: src/tools/write.astro');
    process.exit(1);
  }
  fs.copyFileSync(source, publicRoute);
  console.log('[write-route] enabled /write for local use');
} else if (fs.existsSync(publicRoute)) {
  fs.unlinkSync(publicRoute);
  console.log('[write-route] disabled /write for public build');
}
