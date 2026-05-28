import fs from 'node:fs';
import { execSync } from 'node:child_process';

const root = process.cwd();
const now = new Date();
let commitHash = 'unknown';
let commitTime = now.toISOString();

try {
  commitHash = execSync('git rev-parse --short HEAD', { cwd: root, encoding: 'utf-8' }).trim();
  commitTime = execSync('git log -1 --format=%cI', { cwd: root, encoding: 'utf-8' }).trim();
} catch {
  // fallback: not a git repo or git unavailable
}

const meta = {
  buildTime: now.toISOString(),
  buildDate: now.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }),
  commitHash,
  commitTime,
  version: '2.0.0',
};

fs.writeFileSync(`${root}/public/build-meta.json`, JSON.stringify(meta, null, 2));
console.log(`[build-meta] ${meta.buildDate} @ ${commitHash}`);
