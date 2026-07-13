import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const source = (file) => readFile(path.join(root, file), 'utf8');
const readJson = async (file) => JSON.parse(await source(file));

function assertUniqueIds(items, label) {
  const ids = items.map((item) => item.id);
  assert.equal(new Set(ids).size, ids.length, `${label} contains duplicate ids`);
  assert.ok(
    ids.every((id) => typeof id === 'string' && id.length > 0),
    `${label} contains an empty id`,
  );
}

function assertNonEmpty(value, label) {
  assert.ok(typeof value === 'string' && value.trim().length > 0, `${label} must be non-empty`);
}

function assertReferences(items, validIds, field, label) {
  for (const item of items) {
    for (const id of item[field] ?? []) {
      assert.ok(validIds.has(id), `${label} ${item.id} references missing ${field}: ${id}`);
    }
  }
}

const [common, zh, en, evidence, materials, claims] = await Promise.all([
  readJson('src/data/common.json'),
  readJson('src/data/zh.json'),
  readJson('src/data/en.json'),
  readJson('src/data/evidence.json'),
  readJson('src/data/materials.json'),
  readJson('src/data/claims.json'),
]);

const [resumeCatalogSource, credibilityCatalogSource, selectorSource] = await Promise.all([
  source('src/data/resumeCatalog.ts'),
  source('src/data/credibilityCatalog.ts'),
  source('src/lib/resumeData.ts'),
]);

const bilingualGroups = [
  ['highlights', zh.highlights, en.highlights],
  ['competitions', zh.competitions, en.competitions],
  ['skills', zh.skills, en.skills],
  ['projects', zh.projects, en.projects],
  ['experience', zh.experience, en.experience],
  ['volunteer', zh.volunteer, en.volunteer],
  ['research areas', zh.researchInterests.areas, en.researchInterests.areas],
];
for (const [label, zhItems, enItems] of bilingualGroups) {
  assert.equal(zhItems.length, enItems.length, `${label} bilingual counts differ`);
}

for (const [label, zhItems, enItems] of bilingualGroups.filter(([, items]) => items.every((item) => item.id))) {
  assertUniqueIds(zhItems, `Chinese ${label}`);
  assertUniqueIds(enItems, `English ${label}`);
  assert.deepEqual(
    enItems.map((item) => item.id).sort(),
    zhItems.map((item) => item.id).sort(),
    `${label} bilingual ids differ`,
  );
}

for (const [label, items] of [
  ['common projects', common.projects],
  ['Chinese highlights', zh.highlights],
  ['Chinese projects', zh.projects],
  ['English highlights', en.highlights],
  ['English projects', en.projects],
  ['evidence', evidence.items],
  ['materials', materials.items],
  ['claims', claims.items],
]) {
  assertUniqueIds(items, label);
}

const projectIds = zh.projects.map((item) => item.id);
assert.deepEqual(
  en.projects.map((item) => item.id),
  projectIds,
  'Chinese and English project ids differ',
);
assert.deepEqual(
  common.projects.map((item) => item.id),
  projectIds,
  'Common and localized project ids differ',
);

const categoryIds = new Set(evidence.categories.map((item) => item.id));
const evidenceIds = new Set(evidence.items.map((item) => item.id));
const materialIds = new Set(materials.items.map((item) => item.id));
for (const item of evidence.items) {
  assert.ok(categoryIds.has(item.category), `evidence ${item.id} references missing category`);
  assertNonEmpty(item.year, `evidence ${item.id}.year`);
  for (const field of ['level', 'issuer', 'proofType', 'title', 'claim', 'access']) {
    assertNonEmpty(item[`${field}Zh`], `evidence ${item.id}.${field}Zh`);
    assertNonEmpty(item[`${field}En`], `evidence ${item.id}.${field}En`);
  }
}

const cardHouseEvidence = evidence.items.find((item) => item.id === 'card-house-volunteer-2024');
assert.ok(cardHouseEvidence, 'card-house volunteer evidence is missing');
for (const [lang, sourceData] of [
  ['zh', zh],
  ['en', en],
]) {
  const service = sourceData.volunteer.find((item) => item.id === cardHouseEvidence.id);
  assert.ok(service, `${lang} card-house volunteer service is missing`);
  assert.ok(
    service.summary.includes(cardHouseEvidence.year),
    `${lang} card-house volunteer year differs from evidence`,
  );
}

assertReferences(materials.items, evidenceIds, 'evidenceIds', 'material');
assertReferences(claims.items, evidenceIds, 'evidenceIds', 'claim');
assertReferences(claims.items, materialIds, 'materialIds', 'claim');

for (const item of materials.items) {
  for (const lang of ['zh', 'en']) {
    for (const field of ['title', 'desc', 'action', 'usage', 'status']) {
      assertNonEmpty(item[lang]?.[field], `material ${item.id}.${lang}.${field}`);
    }
  }
  if (item.access === 'local') {
    assert.ok(!item.href, `local material ${item.id} must not expose a public href`);
  } else {
    assertNonEmpty(item.href?.zh, `material ${item.id}.href.zh`);
    assertNonEmpty(item.href?.en, `material ${item.id}.href.en`);
  }
}

for (const item of claims.items) {
  for (const lang of ['zh', 'en']) {
    for (const field of ['title', 'claim', 'boundary']) {
      assertNonEmpty(item[lang]?.[field], `claim ${item.id}.${lang}.${field}`);
    }
  }
  if (item.status === 'evidence-backed') {
    assert.ok(item.evidenceIds.length > 0, `evidence-backed claim ${item.id} has no evidence`);
  }
  if (item.status === 'case-backed') {
    assert.ok(
      item.routes.some((route) => route.startsWith('/')),
      `case-backed claim ${item.id} has no public route`,
    );
  }
}

const portfolioClaim = claims.items.find((item) => item.id === 'public-portfolio-system');
assert.ok(portfolioClaim, 'public portfolio claim is missing');
assert.ok(portfolioClaim.routes.includes('/profile'), 'public portfolio claim must route to /profile');
assert.ok(portfolioClaim.routes.includes('/en/profile'), 'public portfolio claim must route to /en/profile');
assert.ok(!portfolioClaim.routes.includes('/'), 'brand home must not be treated as the resume portfolio');

const moduleBlock = resumeCatalogSource.match(/export const chemAiModuleIds = \[([\s\S]*?)\] as const;/)?.[1];
assert.ok(moduleBlock, 'chemAiModuleIds must remain a typed source list');
const moduleIds = [...moduleBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
assert.equal(moduleIds.length, 15, 'ChemAI module catalog must contain the documented 15 modules');
assert.ok(
  resumeCatalogSource.includes('chemAiModuleCount = chemAiModuleIds.length'),
  'ChemAI module count must be derived from ids',
);

for (const exportName of ['getProfile', 'getEvidence', 'getMaterials', 'getResume']) {
  assert.ok(selectorSource.includes(`export function ${exportName}`), `resume selector ${exportName} is missing`);
}
for (const importName of ['claims.json', 'evidence.json', 'materials.json']) {
  assert.ok(credibilityCatalogSource.includes(importName), `credibility catalog must import ${importName}`);
}

const publicData = { common, zh, en, evidence, materials, claims };
const forbiddenKeys = /^(studentId|birthDate|identityCard|password|apiKey|accessToken|secret|phone|homeAddress)$/i;
const visitKeys = (value, trail = 'catalog') => {
  if (!value || typeof value !== 'object') return;
  for (const [key, child] of Object.entries(value)) {
    assert.ok(!forbiddenKeys.test(key), `public catalog contains private field: ${trail}.${key}`);
    visitKeys(child, `${trail}.${key}`);
  }
};
visitKeys(publicData);
const publicText = JSON.stringify(publicData);
for (const pattern of [/\b1[3-9]\d{9}\b/, /\b\d{17}[\dX]\b/i, /[A-Z]:\\Users\\/i]) {
  assert.ok(!pattern.test(publicText), `public catalog contains private value: ${pattern}`);
}

const sharedAdapters = [
  ['profile.astro', 'ProfilePage'],
  ['evidence.astro', 'EvidencePage'],
  ['materials.astro', 'MaterialsPage'],
  ['modeling.astro', 'ModelingCasePage'],
  ['chem-ai-lab.astro', 'ChemAiCasePage'],
  ['ai-km.astro', 'AiKmPage'],
  ['resume-onepage.astro', 'ResumePage'],
  ['resume-academic.astro', 'ResumePage'],
  ['resume-career.astro', 'ResumePage'],
];
for (const [route, component] of sharedAdapters) {
  await source(`src/components/resume/${component}.astro`);
  for (const prefix of ['src/pages', 'src/pages/en']) {
    const adapterSource = await source(`${prefix}/${route}`);
    assert.ok(adapterSource.includes(component), `${prefix}/${route} must use ${component}`);
    assert.ok(adapterSource.split(/\r?\n/).length <= 12, `${prefix}/${route} must remain a thin adapter`);
  }
}

const sectionBlock = resumeCatalogSource.match(/export const resumeSectionIds = \[([\s\S]*?)\] as const;/)?.[1];
assert.ok(sectionBlock, 'resumeSectionIds must remain a typed source list');
const sectionIds = [...sectionBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const profileComponent = await source('src/components/resume/ProfilePage.astro');
for (const id of sectionIds) {
  assert.ok(profileComponent.includes(`id="${id}"`), `ProfilePage is missing shared section id: ${id}`);
}

console.log('Data contract QA passed.');
