import { defineConfig, devices } from '@playwright/test';

// The site is served under a base path everywhere except Vercel. Tests run
// against the built static output via `astro preview`, so they exercise the
// real production bundle + service worker (not the dev server).
const PORT = 4321;
const BASE_URL = `http://127.0.0.1:${PORT}/distant-friends/`;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'list' : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Cross-browser matrix — run with `pnpm test:all` (needs the browsers
    // installed: `pnpm exec playwright install firefox webkit`).
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    command: `pnpm build && pnpm exec astro preview --host 127.0.0.1 --port ${PORT}`,
    url: BASE_URL,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
