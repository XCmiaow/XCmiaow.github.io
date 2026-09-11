import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
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

const cet6Score = 'CET-6 457';
for (const [lang, sourceData] of [
  ['zh', zh],
  ['en', en],
]) {
  const skillItems = sourceData.skills.flatMap((item) => item.items ?? []);
  assert.ok(skillItems.includes(cet6Score), `${lang} skills must include ${cet6Score}`);
  assert.ok(!skillItems.includes('CET-6 452'), `${lang} skills must not include CET-6 452`);
}

const cumcmEvidenceId = 'cumcm-2024-jiangsu-first';
for (const [label, item] of [
  ['Chinese CUMCM competition', zh.competitions.find((entry) => entry.id === cumcmEvidenceId)],
  ['English CUMCM competition', en.competitions.find((entry) => entry.id === cumcmEvidenceId)],
  ['CUMCM evidence', evidence.items.find((entry) => entry.id === cumcmEvidenceId)],
]) {
  assert.ok(item, `${label} is missing`);
  assert.equal(item.year, '2025', `${label} must match the 2025 award certificate`);
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
for (const [lang, data] of [
  ['zh', zh],
  ['en', en],
]) {
  const chemexam = data.projects.find((item) => item.id === 'chemexam');
  assert.ok(chemexam, `${lang} ChemExam project is missing`);
  assertNonEmpty(chemexam.desc, `${lang} ChemExam summary`);
  assertNonEmpty(chemexam.abilities, `${lang} ChemExam responsibilities`);
}
assert.equal(common.projects.find((item) => item.id === 'chemexam')?.link, '/chemexam');
const chemexamMaterial = materials.items.find((item) => item.id === 'chemexam-case');
assert.ok(chemexamMaterial, 'ChemExam case must be reachable from materials');
assert.deepEqual(chemexamMaterial.href, { zh: '/chemexam', en: '/en/chemexam' });
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

const curtinVolunteerId = 'curtin-university-info-session-volunteer-2026';
const curtinVolunteerEvidence = evidence.items.find((item) => item.id === curtinVolunteerId);
assert.ok(curtinVolunteerEvidence, 'Curtin information-session volunteer evidence is missing');
assert.equal(curtinVolunteerEvidence.category, 'service', 'Curtin volunteer evidence must be service');
assert.equal(curtinVolunteerEvidence.year, '2026', 'Curtin volunteer evidence year is incorrect');
assert.equal(curtinVolunteerEvidence.file, `${curtinVolunteerId}.png`, 'Curtin volunteer evidence file is incorrect');
for (const [lang, sourceData] of [
  ['zh', zh],
  ['en', en],
]) {
  const service = sourceData.volunteer.find((item) => item.id === curtinVolunteerId);
  assert.ok(service, `${lang} Curtin volunteer service is missing`);
  assert.ok(service.summary.includes('2026'), `${lang} Curtin volunteer year is missing`);
  assert.ok(service.summary.includes('1.5'), `${lang} Curtin volunteer hours are missing`);
}

const wuxiStarFutureId = 'wuxi-apptec-star-future-2026';
const wuxiStarFutureEvidence = evidence.items.find((item) => item.id === wuxiStarFutureId);
assert.ok(wuxiStarFutureEvidence, 'WuXi AppTec Star Future evidence is missing');
assert.equal(wuxiStarFutureEvidence.category, 'chemistry', 'WuXi AppTec evidence must be chemistry');
assert.equal(wuxiStarFutureEvidence.year, '2026', 'WuXi AppTec evidence year is incorrect');
assert.equal(wuxiStarFutureEvidence.file, `${wuxiStarFutureId}.png`, 'WuXi AppTec evidence file is incorrect');
assert.ok(
  !zh.competitions.some((item) => item.id === wuxiStarFutureId) &&
    !en.competitions.some((item) => item.id === wuxiStarFutureId),
  'WuXi AppTec youth-camp recognition must not be classified as a competition-level award',
);

const evidenceGallery = materials.items.find((item) => item.id === 'evidence-gallery');
for (const evidenceId of [curtinVolunteerId, wuxiStarFutureId]) {
  assert.ok(evidenceGallery?.evidenceIds.includes(evidenceId), `evidence gallery must reference ${evidenceId}`);
}
const academicResume = materials.items.find((item) => item.id === 'academic-resume');
assert.ok(academicResume?.evidenceIds.includes(curtinVolunteerId), 'academic resume must reference Curtin service');
const campusClaim = claims.items.find((item) => item.id === 'campus-collaboration');
assert.ok(campusClaim?.evidenceIds.includes(curtinVolunteerId), 'campus claim must reference Curtin service');
const chemistryClaim = claims.items.find((item) => item.id === 'chemistry-foundation');
assert.ok(
  chemistryClaim?.evidenceIds.includes(wuxiStarFutureId),
  'chemistry claim must reference WuXi AppTec recognition',
);
await access(path.join(root, 'public/assets/evidence/public', `${curtinVolunteerId}.png`));
await access(path.join(root, 'public/assets/evidence/thumbs', `${curtinVolunteerId}.webp`));
await access(path.join(root, 'public/assets/evidence/public', `${wuxiStarFutureId}.png`));
await access(path.join(root, 'public/assets/evidence/thumbs', `${wuxiStarFutureId}.webp`));

const academicCompetitionIndividualId = 'academic-competition-individual-2025';
const academicCompetitionIndividualEvidence = evidence.items.find(
  (item) => item.id === academicCompetitionIndividualId,
);
assert.ok(academicCompetitionIndividualEvidence, 'academic competition individual evidence is missing');
assert.equal(
  academicCompetitionIndividualEvidence.category,
  'academic',
  'academic competition individual evidence must be academic',
);
assert.equal(
  academicCompetitionIndividualEvidence.year,
  '2024-2025',
  'academic competition individual evidence year is incorrect',
);
assert.equal(
  academicCompetitionIndividualEvidence.file,
  `${academicCompetitionIndividualId}.png`,
  'academic competition individual evidence file is incorrect',
);
assert.equal(
  academicCompetitionIndividualEvidence.titleZh,
  '2024—2025学年大学生学科竞赛先进个人',
  'academic competition individual evidence title is incorrect',
);
assert.ok(
  resumeCatalogSource.includes(`'${academicCompetitionIndividualId}': ['${academicCompetitionIndividualId}']`),
  'academic competition individual honor must map to its evidence',
);
await access(path.join(root, 'public/assets/evidence/public', `${academicCompetitionIndividualId}.png`));
await access(path.join(root, 'public/assets/evidence/thumbs', `${academicCompetitionIndividualId}.webp`));

const mathorCup2026Id = 'mathorcup-2026-national-second';
const mathorCup2026Zh = zh.competitions.find((item) => item.id === mathorCup2026Id);
const mathorCup2026En = en.competitions.find((item) => item.id === mathorCup2026Id);
const mathorCup2026Evidence = evidence.items.find((item) => item.id === mathorCup2026Id);
assert.ok(mathorCup2026Zh, '2026 MathorCup award is missing from Chinese competitions');
assert.ok(mathorCup2026En, '2026 MathorCup award is missing from English competitions');
assert.ok(mathorCup2026Evidence, '2026 MathorCup award is missing from evidence');
assert.equal(mathorCup2026Zh.year, '2026', '2026 MathorCup Chinese year is incorrect');
assert.equal(mathorCup2026En.year, '2026', '2026 MathorCup English year is incorrect');
assert.equal(mathorCup2026Zh.level, 'national', '2026 MathorCup Chinese level must be national');
assert.equal(mathorCup2026En.level, 'national', '2026 MathorCup English level must be national');
assert.equal(mathorCup2026Evidence.category, 'modeling', '2026 MathorCup evidence must be modeling');
assert.equal(mathorCup2026Evidence.file, `${mathorCup2026Id}.png`, '2026 MathorCup evidence file is incorrect');
assert.ok(
  resumeCatalogSource.includes(`'${mathorCup2026Id}': ['${mathorCup2026Id}']`),
  '2026 MathorCup award must map to its evidence',
);
for (const variant of ['general', 'academic', 'career']) {
  const variantBlock = selectorSource.match(new RegExp(`${variant}: \\[([\\s\\S]*?)\\]`))?.[1];
  assert.ok(variantBlock?.includes(`'${mathorCup2026Id}'`), `${variant} resume must include 2026 MathorCup`);
  assert.ok(!variantBlock?.includes("'mathorcup-2025-second'"), `${variant} resume must replace 2025 MathorCup`);
}
for (const materialId of ['general-resume', 'academic-resume', 'career-resume', 'evidence-gallery', 'modeling-case']) {
  const material = materials.items.find((item) => item.id === materialId);
  assert.ok(material?.evidenceIds.includes(mathorCup2026Id), `${materialId} must reference 2026 MathorCup`);
}
const modelingClaim = claims.items.find((item) => item.id === 'modeling-practice');
assert.ok(modelingClaim?.evidenceIds.includes(mathorCup2026Id), 'modeling claim must reference 2026 MathorCup');
await access(path.join(root, 'public/assets/evidence/public', `${mathorCup2026Id}.png`));
await access(path.join(root, 'public/assets/evidence/thumbs', `${mathorCup2026Id}.webp`));

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
assert.ok(!publicText.includes('2410407105'), 'public catalog contains the Curtin service student ID');
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

const evidenceComponent = await source('src/components/resume/EvidencePage.astro');
assert.ok(!evidenceComponent.includes("claim: '支撑叙事'"), 'EvidencePage must not label a supported-claim block');
assert.ok(
  !evidenceComponent.includes("claim: 'Supported claim'"),
  'English EvidencePage must not label a supported-claim block',
);
assert.ok(!evidenceComponent.includes('{item.claim}'), 'EvidencePage must not render supported-claim content');

const sectionBlock = resumeCatalogSource.match(/export const resumeSectionIds = \[([\s\S]*?)\] as const;/)?.[1];
assert.ok(sectionBlock, 'resumeSectionIds must remain a typed source list');
const sectionIds = [...sectionBlock.matchAll(/'([^']+)'/g)].map((match) => match[1]);
const profileComponent = await source('src/components/resume/ProfilePage.astro');
for (const id of sectionIds) {
  assert.ok(profileComponent.includes(`id="${id}"`), `ProfilePage is missing shared section id: ${id}`);
}

console.log('Data contract QA passed.');
