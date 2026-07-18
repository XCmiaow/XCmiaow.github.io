# Mobile Contact Icon Row Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the five homepage contact links as one accessible, equally spaced icon row on mobile.

**Architecture:** Keep the shared Astro footer and its desktop/default variants intact. Add one Playwright regression check to the existing release QA, then apply a mobile-only five-column grid and explicit accessible names in the footer component.

**Tech Stack:** Astro 6, scoped CSS, Playwright 1.60, Node.js QA scripts.

---

## File map

- Modify `scripts/qa-check.mjs`: verify the mobile contact row at 360px and 390px.
- Modify `src/components/silicon-embers/SiliconEmbersFooter.astro`: add accessible link names and the mobile-only grid rules.

### Task 1: Lock the mobile contact layout

**Files:**

- Modify: `scripts/qa-check.mjs`

- [ ] **Step 1: Write the failing browser check**

Add this function before `checkInteractions()`:

```js
async function checkMobileContactRow(page) {
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`${previewBase}/`, { waitUntil: 'load' });
    const layout = await page.locator('.sa-footer.contact nav .footer-link').evaluateAll((links) => {
      const boxes = links.map((link) => link.getBoundingClientRect());
      const visibleLabels = links.filter((link) => {
        const label = link.querySelector('span');
        return label && getComputedStyle(label).display !== 'none' && label.getBoundingClientRect().width > 0;
      }).length;
      return {
        count: links.length,
        rowCount: new Set(boxes.map((box) => Math.round(box.top))).size,
        widths: boxes.map((box) => box.width),
        minHeight: Math.min(...boxes.map((box) => box.height)),
        overflow: boxes.some((box) => box.left < -1 || box.right > innerWidth + 1),
        visibleLabels,
        missingNames: links.filter((link) => !link.getAttribute('aria-label')?.trim()).length,
      };
    });
    if (layout.count !== 5) fail(`Mobile contact footer exposes ${layout.count} links at ${width}px; expected 5`);
    if (layout.rowCount !== 1) fail(`Mobile contact links use ${layout.rowCount} rows at ${width}px; expected 1`);
    if (Math.max(...layout.widths) - Math.min(...layout.widths) > 1) {
      fail(`Mobile contact links are not equally sized at ${width}px`);
    }
    if (layout.minHeight < 44) fail(`Mobile contact targets are shorter than 44px at ${width}px`);
    if (layout.overflow) fail(`Mobile contact row overflows at ${width}px`);
    if (layout.visibleLabels !== 0) fail(`Mobile contact row still shows ${layout.visibleLabels} labels at ${width}px`);
    if (layout.missingNames !== 0) fail(`Mobile contact row has ${layout.missingNames} unnamed links at ${width}px`);
  }
}
```

Call `await checkMobileContactRow(page);` immediately after `await checkCourse(page);` in the preview test sequence.

- [ ] **Step 2: Run the check and verify RED**

Run:

```powershell
npm run build
node scripts/qa-check.mjs
```

Expected: the check fails because the mobile footer uses five rows, shows text labels, and lacks explicit `aria-label` values.

### Task 2: Implement the five-icon row

**Files:**

- Modify: `src/components/silicon-embers/SiliconEmbersFooter.astro`

- [ ] **Step 1: Add an explicit accessible name**

Add the label to each footer anchor without changing its destination or visible desktop text:

```astro
<a
  class="footer-link"
  href={link.href}
  aria-label={link.label}
  target={link.external ? '_blank' : undefined}
  rel={link.external ? 'noopener noreferrer' : undefined}></a>
```

- [ ] **Step 2: Replace the mobile one-column layout**

Inside the existing `@media (max-width: 720px)` block, use these contact-only rules:

```css
.contact nav {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.contact .footer-link {
  min-height: 3.5rem;
  justify-content: center;
  border-right: 1px solid var(--line);
  padding: 0;
}

.contact .footer-link:last-child {
  border-right: 0;
}

.contact .footer-link span {
  display: none;
}
```

Remove the mobile rule that clears the odd-item right border; the new rules give every adjacent cell one separator.

- [ ] **Step 3: Run the browser check and verify GREEN**

Run:

```powershell
npm run build
node scripts/qa-check.mjs
```

Expected: exit code 0; both mobile widths use one equal row, all targets are at least 44px, labels are visually hidden, and every link has an accessible name.

- [ ] **Step 4: Format and commit**

Run:

```powershell
npx prettier --write scripts/qa-check.mjs src/components/silicon-embers/SiliconEmbersFooter.astro
git add scripts/qa-check.mjs src/components/silicon-embers/SiliconEmbersFooter.astro
git commit -m "fix: align mobile contact icons"
```

### Task 3: Complete the release

**Files:**

- No additional production files expected.

- [ ] **Step 1: Finish the already-approved animation work**

Execute the remaining Tasks 3-5 in `docs/superpowers/plans/2026-07-14-home-animation-performance.md`. Require its focused animation, lifecycle, geometry, and visual checks to pass and commit those files before continuing.

- [ ] **Step 2: Run the full release gate**

Run `npm run check` and require exit code 0.

- [ ] **Step 3: Push and verify GitHub Pages**

Push `main`, watch the `Deploy to GitHub Pages` workflow through success, then request the deployed homepage with a cache-busting query and require HTTP 200 plus five mobile footer links in the delivered markup.
