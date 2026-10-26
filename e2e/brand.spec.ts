import { expect, test, type Page } from '@playwright/test';
import { expectNoHorizontalScroll, openPromoterPanel, openWithFrozenClock, register, runUntilTimeUp } from './helpers';

async function activateBrand(page: Page, name: 'GranPlus' | 'Biofresh') {
  const panel = await openPromoterPanel(page);
  await panel.getByRole('radio', { name: name }).check({ force: true });
  await panel.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(panel.getByTestId('active-brand')).toContainText(name);
  await panel.getByRole('button', { name: 'Cerrar', exact: true }).click();
}

test.describe('marcas', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name === 'escritorio', 'Revisión en tablet y celular'));

  test('GranPlus es la marca por defecto y conserva su apariencia', async ({ page }) => {
    await openWithFrozenClock(page);
    await expect(page.locator('html')).toHaveAttribute('data-brand', 'granplus');
    await expect(page.getByRole('img', { name: 'GranPlus' }).first()).toBeVisible();
    const title = page.getByRole('heading', { name: '¡Alimentá al campeón!' });
    await expect(title).toHaveCSS('color', 'rgb(243, 200, 121)');
    await expect(page.getByRole('button', { name: 'Continuar' })).toHaveCSS('color', 'rgb(84, 3, 42)');
    expect(await title.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Figtree');
  });

  test('Biofresh se activa desde el panel, persiste y se aplica en todas las pantallas', async ({ page }, info) => {
    const dir = `test-results/capturas/biofresh/${info.project.name}`;
    const shot = (n: string) => page.screenshot({ path: `${dir}/${n}.png` });

    await openWithFrozenClock(page);
    await activateBrand(page, 'Biofresh');
    await expect(page.locator('html')).toHaveAttribute('data-brand', 'biofresh');

    // Persistencia: sobrevive a una recarga.
    await page.reload();
    await page.clock.pauseAt(new Date('2026-10-22T12:02:00-03:00'));
    await expect(page.locator('html')).toHaveAttribute('data-brand', 'biofresh');
    await expect(page).toHaveTitle(/Biofresh/);

    const title = page.getByRole('heading', { name: '¡Alimentá al campeón!' });
    expect(await title.evaluate((el) => getComputedStyle(el).fontFamily)).toContain('Playfair Display');
    await expect(page.getByRole('img', { name: 'Biofresh' }).first()).toBeVisible();
    await expect(page.getByText(/promociones de Biofresh/)).toBeVisible();
    await expectNoHorizontalScroll(page);
    await shot('1-registro');

    await register(page);
    await expect(page.getByRole('img', { name: 'Biofresh' })).toBeVisible();
    await shot('2-especie');

    await page.getByRole('button', { name: /mi campeón es un gato/i }).click();
    await page.getByRole('radio', { name: /persa/i }).click();
    await expectNoHorizontalScroll(page);
    await shot('3-raza');
    await page.getByRole('button', { name: /vamos, persa/i }).click();
    await expect(page.getByRole('heading', { name: '¡Tu campeón te necesita!' })).toBeVisible();
    await shot('4-instrucciones');

    await page.getByRole('button', { name: '¡A jugar!' }).click();
    await expect(page.getByTestId('champion')).toHaveAttribute('data-breed', 'persa');
    await page.clock.runFor(3_200 + 6_000);
    await expect(page.getByRole('img', { name: 'Biofresh' })).toBeVisible();
    await shot('5-partida');

    await runUntilTimeUp(page);
    await page.clock.runFor(2_000);
    await expect(page.getByTestId('result-screen')).toBeVisible();
    await expect(page.getByRole('img', { name: 'Biofresh' })).toBeVisible();
    await shot('6-resultado');

    await page.getByRole('button', { name: 'Ver mi premio' }).click();
    await expect(page.getByRole('heading', { name: '¡Gracias por jugar con Biofresh!' })).toBeVisible();
    await expect(page.getByRole('img', { name: /envase biofresh/i })).toHaveCount(2);
    await expectNoHorizontalScroll(page);
    await page.clock.runFor(1_500);
    await shot('7-premio');

    // Volver a GranPlus restaura la apariencia original.
    await page.getByRole('button', { name: 'Finalizar' }).click();
    await activateBrand(page, 'GranPlus');
    await expect(page.locator('html')).toHaveAttribute('data-brand', 'granplus');
    await expect(page.getByRole('heading', { name: '¡Alimentá al campeón!' })).toHaveCSS('color', 'rgb(243, 200, 121)');
  });

  test('el botón de sonido se respeta entre pantallas y al recargar', async ({ page }) => {
    await openWithFrozenClock(page);
    const toggle = page.getByTestId('sound-toggle');
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-pressed', 'false');
    await register(page);
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
    await page.reload();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'false');
    await page.getByTestId('sound-toggle').click();
    await expect(page.getByTestId('sound-toggle')).toHaveAttribute('aria-pressed', 'true');
  });
});
