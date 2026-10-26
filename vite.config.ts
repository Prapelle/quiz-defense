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
        globPatterns: ['**/*.{html,js,css,svg,webmanifest,woff2,png,jpg,webp}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
      },
    }),
  ],
  base: './',
});
