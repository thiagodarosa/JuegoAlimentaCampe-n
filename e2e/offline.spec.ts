import { expect, test } from '@playwright/test';
import { chooseChampion, freezeClock, register } from './helpers';

test.describe('funcionamiento sin conexión', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'Se prueba una vez'));

  test('después de la primera carga, la app completa funciona sin internet', async ({ page, context }) => {
    await page.goto('/');
    // Espera a que el Service Worker termine de precachear y controle la página.
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.getByRole('heading', { name: '¡Alimentá al campeón!' })).toBeVisible();

    // Logo y tipografía locales.
    const logoOk = await page.getByRole('img', { name: 'GranPlus' }).first().evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
    expect(logoOk).toBe(true);
    const fontOk = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('900 20px Figtree');
    });
    expect(fontOk).toBe(true);

    await freezeClock(page);
    await register(page);
    await chooseChampion(page, 'gato', /maine coon/i);
    await page.getByRole('button', { name: '¡A jugar!' }).click();
    await page.clock.runFor(3_200 + 30_000 + 2_000);
    await expect(page.getByTestId('result-screen')).toBeVisible();
    await page.getByRole('button', { name: 'Ver mi premio' }).click();

    const packs = page.getByRole('img', { name: /envase granplus/i });
    await expect(packs).toHaveCount(2);
    for (const img of await packs.all()) {
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }

    await page.getByRole('button', { name: 'Finalizar' }).click();
    await expect(page.getByLabel('Nombre completo')).toHaveValue('');
    await context.setOffline(false);
  });

  test('Biofresh también funciona sin internet (logo, tipografías y envases locales)', async ({ page, context }) => {
    await page.goto('/');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
      localStorage.setItem('granplus-campeon:settings:v1', JSON.stringify({ brand: 'biofresh' }));
    });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);

    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-brand', 'biofresh');
    const logoOk = await page.getByRole('img', { name: 'Biofresh' }).first().evaluate((img: HTMLImageElement) => img.naturalWidth > 0);
    expect(logoOk).toBe(true);
    const fontsOk = await page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('800 20px "Playfair Display"') && document.fonts.check('400 16px "Nunito Sans"');
    });
    expect(fontsOk).toBe(true);

    await freezeClock(page);
    await register(page);
    await chooseChampion(page, 'perro', /bulldog/i);
    await page.getByRole('button', { name: '¡A jugar!' }).click();
    await page.clock.runFor(3_200 + 30_000 + 2_000);
    await page.getByRole('button', { name: 'Ver mi premio' }).click();
    // Las grabaciones de ladrido y maullido también quedaron guardadas para usarse sin red.
    const cachedSounds = await page.evaluate(async () => {
      let n = 0;
      for (const key of await caches.keys()) {
        const reqs = await (await caches.open(key)).keys();
        n += reqs.filter((r) => /\.mp3(\?|$)/.test(r.url)).length;
      }
      return n;
    });
    expect(cachedSounds).toBe(2);
    const packs = page.getByRole('img', { name: /envase biofresh/i });
    await expect(packs).toHaveCount(2);
    for (const img of await packs.all()) {
      await expect.poll(() => img.evaluate((el: HTMLImageElement) => el.complete && el.naturalWidth > 0)).toBe(true);
    }
    await context.setOffline(false);
  });
});
