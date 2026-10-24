/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  server: {
    // En carpetas sincronizadas por OneDrive, el observador de archivos puede perder
    // cambios y servir módulos desactualizados: se usa sondeo en ese caso.
    watch: process.cwd().includes('OneDrive') ? { usePolling: true, interval: 300 } : undefined,
  },
  plugins: [
    react(),
    VitePWA({
      // 'prompt': la nueva versión se instala solo cuando la promotora lo confirma,
      // nunca en medio de una partida.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'GranPlus · ¡Alimentá al campeón!',
        short_name: 'Alimentá al campeón',
        description: 'Minijuego promocional de GranPlus para activaciones en pet shops y veterinarias.',
        lang: 'es-UY',
        start_url: '/',
        scope: '/',
        display: 'fullscreen',
        orientation: 'any',
        background_color: '#4D0225',
        theme_color: '#54032A',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,webp,jpg,svg,woff2,mp3}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    alias: {
      'virtual:pwa-register/react': fileURLToPath(new URL('./src/test/pwa-register-mock.ts', import.meta.url)),
    },
  },
});
