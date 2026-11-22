import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    react(),
    // Installable and offline. A new version waits until the app is closed and opened
    // again, so a game in progress is never swapped out from under the host.
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'script',
      manifest: {
        name: 'Mafia Host',
        short_name: 'Mafia',
        description: 'Run a Mafia game: roles, nights, days, votes and speech timers.',
        display: 'standalone',
        orientation: 'any',
        // neon theme --surface-page (--c-plum-900); the manifest needs literal colours
        background_color: '#140a26',
        theme_color: '#140a26',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: 'icon.svg', sizes: 'any', type: 'image/svg+xml' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  server: { port: 5173, host: true },
  // Playwright specs live in e2e/ and run with `npm run test:e2e`
  test: { include: ['src/**/*.test.ts'] },
});
