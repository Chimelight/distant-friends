import { test, expect, type Page } from '@playwright/test';

const copyButtons = (page: Page) => page.getByRole('button', { name: /^Copy / });

// The Theme + View toggles live in the StickyBar, which is pointer-events:none
// until the reader scrolls <main> to the top. Activate it before interacting.
async function activateStickyBar(page: Page) {
  await page.evaluate(() => document.querySelector('main')?.scrollIntoView());
  await expect(page.locator('.sticky-bar')).toHaveClass(/on/);
}

test.beforeEach(async ({ page }) => {
  await page.goto('./');
  await expect(copyButtons(page).first()).toBeVisible();
});

test('renders the masthead and a populated phrase grid', async ({ page }) => {
  await expect(page.getByRole('heading', { name: /Distant\s+Friends/i })).toBeVisible();
  expect(await copyButtons(page).count()).toBeGreaterThan(20);
});

test('clicking a phrase copies it and raises the toast', async ({ page, context }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'clipboard permission is only grantable in chromium');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);

  await copyButtons(page).first().click();

  const toast = page.getByRole('status');
  await expect(toast).toHaveClass(/on/);
  await expect(toast).toContainText('Copied');

  const clip = await page.evaluate(() => navigator.clipboard.readText());
  expect(clip.length).toBeGreaterThan(0);
});

test('theme toggle drives <html data-theme>', async ({ page }) => {
  await activateStickyBar(page);

  await page.getByRole('button', { name: 'Dark theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.getByRole('button', { name: 'Light theme' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('a Stationery slot picker opens and applies the chosen option', async ({ page }) => {
  const stationery = page.locator('.stationery');
  const toneSlot = stationery.locator('[data-slot="tone"]');

  await toneSlot.click();
  const option = stationery.getByRole('menuitemradio', { name: 'politely' });
  await expect(option).toBeVisible();

  await option.click();
  await expect(toneSlot).toContainText('politely');
});

test('a table column header switches its language', async ({ page }) => {
  // zh (中文) is the first non-anchor column by default.
  const firstCol = page.locator('.scene-block').first().locator('th.th-lang').first();
  await expect(firstCol.locator('.th-native')).toHaveText('中文');

  await firstCol.locator('.th-btn').click();
  // Korean isn't shown yet → picking it swaps this column to Korean.
  await page.getByRole('button', { name: 'Korean' }).click();

  await expect(firstCol.locator('.th-native')).toHaveText('한국어');
});

test('the Stationery language picker (cards view) filters by search', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 }); // narrow → cards view
  await page.reload();

  const trigger = page.locator('.lang-line .trigger');
  await expect(trigger).toBeVisible();
  await trigger.click();

  const panel = page.locator('.lang-line .panel');
  await panel.getByPlaceholder(/Search languages/).fill('kor');
  await expect(panel.getByRole('button', { name: 'Korean' })).toBeVisible();
  await expect(panel.getByRole('button', { name: 'German' })).toHaveCount(0);
});

test('starring a phrase reveals the "Starred only" filter and narrows the grid', async ({ page }) => {
  const before = await copyButtons(page).count();

  await page.getByRole('button', { name: 'Star this phrase' }).first().click();

  const filter = page.getByRole('button', { name: /Starred only/i });
  await expect(filter).toBeVisible();

  await filter.click();
  await expect(filter).toHaveAttribute('aria-pressed', 'true');

  await expect(async () => {
    expect(await copyButtons(page).count()).toBeLessThan(before);
  }).toPass();
});
