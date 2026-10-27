import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'generateSW',
      filename: 'sw.js',
      includeAssets: ['icons/icon.svg'],
      manifest: false,
      workbox: {
        navigateFallback: 'index.html',
        globPatterns: ['**/*.{html,js,css,svg,webmanifest,woff2,png,jpg,webp,mp3}'],
        // Phaser alone is ~1.7 MB; keep headroom so the main bundle is never silently dropped from precache.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  base: './',
});
