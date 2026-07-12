import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'yaml';

const COURSE_DIR = resolve('src/content/course');
const EXPECTED_MODULES = ['foundations-1', 'foundations-2', 'task-design', 'tool-systems', 'agents', 'workflow-lab'];

function readEntry(file) {
  const source = readFileSync(resolve(COURSE_DIR, file), 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  assert(match, `${file}: missing frontmatter`);

  const data = parse(match[1]);

  return { file, data, body: source.slice(match[0].length).trim() };
}

export function validateCourse(entries, { release = false } = {}) {
  assert.equal(entries.length, 6, 'course must contain exactly six units');
  assert.deepEqual(
    entries.map(({ data }) => data.module).sort(),
    [...EXPECTED_MODULES].sort(),
    'course modules must match the curriculum contract',
  );

  const orders = entries.map(({ data }) => data.order);
  assert.equal(new Set(orders).size, entries.length, 'course order values must be unique');
  assert.equal(
    entries.reduce((total, { data }) => total + data.durationMinutes, 0),
    720,
    'course duration must total 720 minutes',
  );

  const productMinutes = entries.reduce((total, { data }) => total + data.productMinutes, 0);
  assert(productMinutes >= 240 && productMinutes <= 300, 'product time must stay between 240 and 300 minutes');
  assert(
    entries.reduce((total, { data }) => total + (data.workBuddyMinutes ?? 0), 0) <= 60,
    'WorkBuddy-specific time must not exceed 60 minutes',
  );

  const ids = new Set(entries.map(({ file }) => file.replace(/\.mdx$/, '')));
  for (const { file, data, body } of entries) {
    assert(Array.isArray(data.objectives) && data.objectives.length >= 2, `${file}: objectives missing`);
    assert(Array.isArray(data.deliverables) && data.deliverables.length >= 1, `${file}: deliverables missing`);
    assert(Array.isArray(data.prerequisites), `${file}: prerequisites missing`);
    for (const prerequisite of data.prerequisites) {
      assert(ids.has(prerequisite), `${file}: unknown prerequisite ${prerequisite}`);
    }
    if (data.productMinutes > 0) {
      assert(Array.isArray(data.sources) && data.sources.length > 0, `${file}: product lesson needs sources`);
    }
    if (release) {
      assert.equal(data.draftBody, false, `${file}: draft body cannot ship`);
      assert(body.length >= 1200, `${file}: released unit body is incomplete`);
      assert(!body.includes('TODO'), `${file}: TODO marker cannot ship`);
      assert(!body.includes('�'), `${file}: encoding corruption detected`);
    }
  }
}

const files = readdirSync(COURSE_DIR)
  .filter((file) => file.endsWith('.mdx'))
  .sort();
const entries = files.map(readEntry);
validateCourse(entries, { release: process.env.COURSE_RELEASE === '1' });

console.log(
  JSON.stringify({
    courseContent: 'ok',
    units: entries.length,
    durationMinutes: entries.reduce((total, { data }) => total + data.durationMinutes, 0),
    productMinutes: entries.reduce((total, { data }) => total + data.productMinutes, 0),
  }),
);
