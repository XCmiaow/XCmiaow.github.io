import fs from 'node:fs';
import path from 'node:path';
import { composeBlogPost } from '../src/tools/blogComposer.js';

const root = process.cwd();
const args = new Map();

for (let i = 2; i < process.argv.length; i += 1) {
  const arg = process.argv[i];
  if (!arg.startsWith('--')) continue;
  const key = arg.slice(2);
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(key, next);
    i += 1;
  } else {
    args.set(key, 'true');
  }
}

function requiredArg(name) {
  const value = args.get(name);
  if (!value) {
    console.error(`Missing --${name}`);
    process.exit(1);
  }
  return value;
}

const bodyFile = args.get('body-file');
const body = bodyFile ? fs.readFileSync(path.resolve(root, bodyFile), 'utf8') : requiredArg('body');
const post = composeBlogPost({
  title: requiredArg('title'),
  body,
  lang: args.get('lang') || 'zh',
  description: args.get('description') || '',
  tags: args.get('tags') || '',
  date: args.get('date'),
  slug: args.get('slug'),
});

const outPath = path.join(root, post.path);
if (fs.existsSync(outPath) && !args.has('force')) {
  console.error(`Refusing to overwrite existing post: ${post.path}`);
  process.exit(1);
}

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, post.content, 'utf8');
console.log(JSON.stringify({ path: post.path, slug: post.slug }, null, 2));
