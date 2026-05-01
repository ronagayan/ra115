import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['horse-pig.png', 'favicon.ico'],
      manifest: {
        name: '💚',
        short_name: '💚',
        theme_color: '#1a3a2a',
        background_color: '#0d1f16',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,jpg,jpeg,webp}'],
        // Activate new SW immediately on next page load (don't wait for all
        // tabs to close). Critical when the bundle's Firebase config changes.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
