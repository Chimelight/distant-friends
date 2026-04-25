// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import AstroPWA from '@vite-pwa/astro';

// Vercel deploys at the domain root; GitHub Pages serves the project under
// /distant-friends/. Vercel injects VERCEL=1 in its build env.
const isVercel = !!process.env.VERCEL;
const site = isVercel
  ? 'https://distant-friends.vercel.app'
  : 'https://chimelight.github.io';
const base = isVercel ? '/' : '/distant-friends';

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
        theme_color: '#EBE1CC',
        background_color: '#EBE1CC',
        display: 'standalone',
        start_url: base,
      },
      workbox: { globPatterns: [] },
    }),
  ],
});
