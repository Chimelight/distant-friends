// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import AstroPWA from '@vite-pwa/astro';

// Vercel deploys at the domain root; GitHub Pages serves the project under
// /distant-friends/. Vercel injects VERCEL=1 in its build env.
// (R9 note: rewriting the CJK faces to font-display:optional was tried here
// and measured — Chrome then prefetches every unicode-range-intersecting
// subset "for next time" (48 → 97 requests) and simulated slow-4G FCP
// doubled. Reverted; the first-screen CJK is pinned to local serifs instead.)
const isVercel = !!process.env.VERCEL;
const site = isVercel
  ? 'https://distant-friends.vercel.app'
  : 'https://chimelight.github.io';
// Trailing slash matters: import.meta.env.BASE_URL reflects this verbatim,
// so '/distant-friends' (no slash) breaks string concatenation in templates
// like ${BASE_URL}favicon.svg → /distant-friendsfavicon.svg.
const base = isVercel ? '/' : '/distant-friends/';

// https://astro.build/config
export default defineConfig({
  site,
  base,
  integrations: [
    svelte(),
    AstroPWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Distant Friends',
        short_name: 'Friends',
        description:
          'A warm glossary of friendly phrases across languages, tuned to who you write to and how you want to sound.',
        lang: 'en',
        theme_color: '#EBE1CC',
        background_color: '#EBE1CC',
        display: 'standalone',
        start_url: base,
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Phrase data is bundled into the JS (import.meta.glob), so caching
        // the shell makes the whole glossary work offline. Fonts are NOT
        // precached: the CJK Noto faces ship as ~100 unicode-range subset
        // files (tens of MB) — they are cached at first use instead.
        globPatterns: ['**/*.{html,css,js,svg,webmanifest}'],
        globIgnores: ['**/og-image*'],
        navigateFallback: `${base}index.html`,
        runtimeCaching: [
          {
            urlPattern: /\.woff2?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts',
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /\/icons\/.*\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'icons',
              expiration: { maxEntries: 8, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
});
