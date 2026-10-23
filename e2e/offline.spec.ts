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
});
