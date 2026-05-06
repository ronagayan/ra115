import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'horse-pig.png',
        'favicon.ico',
        'apple-touch-icon.png',
        'pwa-192.png',
        'pwa-512.png',
        'maskable-512.png',
      ],
      manifest: {
        name: 'שנתיים 💚',
        short_name: '💚',
        description: 'שנתיים יחד',
        theme_color: '#1a3a2a',
        background_color: '#0d1f16',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        lang: 'he',
        dir: 'rtl',
        icons: [
          { src: '/pwa-192.png',     sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png',     sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/maskable-512.png',sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
        ],
      },
      workbox: {
        // Precache only the small/critical assets. Photos are loaded
        // on-demand and cached at runtime so the SW install isn't a 13 MiB
        // download.
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'CacheFirst',
            options: {
              cacheName: 'ra115-images',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 60 * 60 * 24 * 60, // 60 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'ra115-fonts' },
          },
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
