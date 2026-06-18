export function slugifyTitle(title) {
  return (
    String(title || '')
      .trim()
      .toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fa5-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 80) || 'post'
  );
}

function escapeFrontmatterValue(value) {
  return String(value || '')
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

function normalizeTags(tags) {
  if (Array.isArray(tags)) return tags.map((tag) => String(tag).trim()).filter(Boolean);
  return String(tags || '')
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function composeBlogPost(input = {}) {
  const title = String(input.title || '').trim();
  const body = String(input.body || '').trim();
  const lang = input.lang === 'en' ? 'en' : 'zh';
  const description = String(input.description || '').trim();
  const tags = normalizeTags(input.tags);
  const date = input.date || new Date().toISOString().slice(0, 10);
  const slug = slugifyTitle(input.slug || title);

  if (!title) throw new Error('Title is required');
  if (!body) throw new Error('Body is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Date must use YYYY-MM-DD');

  const frontmatter = [
    '---',
    `title: "${escapeFrontmatterValue(title)}"`,
    `description: "${escapeFrontmatterValue(description)}"`,
    `date: ${date}`,
    `lang: ${lang}`,
    `tags: [${tags.map((tag) => `"${escapeFrontmatterValue(tag)}"`).join(', ')}]`,
    'draft: false',
    '---',
    '',
  ].join('\n');

  return {
    slug,
    filename: `${slug}.md`,
    path: `src/content/blog/${slug}.md`,
    content: `${frontmatter}${body}\n`,
  };
}
