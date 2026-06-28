import { test, expect } from '@playwright/test';

// The whole glossary ships its data inside the JS bundle, so precaching the
// shell (Workbox, configured in astro.config.mjs) makes the site fully usable
// offline. This guards that promise.
test('serves the glossary offline once the service worker has cached the shell', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'service-worker offline behaviour is verified on chromium');

  await page.goto('./');
  // Let the SW install, activate, and take control of the page.
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller, null, { timeout: 15_000 });

  await context.setOffline(true);
  try {
    await page.reload();
    await expect(page.getByRole('heading', { name: /Distant\s+Friends/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Copy / }).first()).toBeVisible();
  } finally {
    await context.setOffline(false);
  }
});
