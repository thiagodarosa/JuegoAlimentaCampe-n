import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas de punta a punta contra la versión de producción (`vite preview`),
 * que es la que incluye el Service Worker para el modo sin conexión.
 */
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:4173',
    locale: 'es-UY',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'tablet-horizontal',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 }, hasTouch: true },
    },
    {
      name: 'tablet-vertical',
      use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 }, hasTouch: true },
    },
    {
      name: 'celular',
      use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 3 },
    },
    {
      name: 'escritorio',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } },
    },
  ],
  webServer: {
    command: 'npm run build && npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
