import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const WCAG = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

function scan(page: Page) {
  return new AxeBuilder({ page }).withTags(WCAG).analyze();
}

test('no WCAG 2.1 A/AA violations on first load (light)', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeVisible();

  const { violations } = await scan(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test('no WCAG 2.1 A/AA violations with a column language menu open', async ({ page }) => {
  await page.goto('./');
  const btn = page.locator('.scene-block').first().locator('th.th-lang .th-btn').first();
  await btn.click();
  await expect(btn).toHaveAttribute('aria-expanded', 'true');

  const { violations } = await scan(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test('no WCAG 2.1 A/AA violations for the Stationery picker (cards view)', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 800 });
  await page.goto('./');
  const trigger = page.locator('.lang-line .trigger');
  await trigger.click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'true');

  const { violations } = await scan(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});

test('no WCAG 2.1 A/AA violations in dark theme', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeVisible();
  await page.evaluate(() => (document.documentElement.dataset.theme = 'dark'));

  const { violations } = await scan(page);
  expect(violations, JSON.stringify(violations, null, 2)).toEqual([]);
});
