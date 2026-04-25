// @ts-check
import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';
import AstroPWA from '@vite-pwa/astro';

// https://astro.build/config
export default defineConfig({
  site: 'https://chimelight.github.io',
  base: '/distant-friends',
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
        start_url: '/distant-friends/',
      },
      workbox: { globPatterns: [] },
    }),
  ],
});
