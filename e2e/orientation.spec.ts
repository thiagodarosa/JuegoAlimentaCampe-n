import { expect, test } from '@playwright/test';
import { chooseChampion, expectNoHorizontalScroll, openWithFrozenClock, register, runUntilTimeUp } from './helpers';

test.describe('cambio de orientación durante la partida', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'tablet-horizontal', 'Se prueba una vez, en tablet'));

  test('no reinicia el cronómetro ni duplica el área de juego', async ({ page }) => {
    await openWithFrozenClock(page);
    await register(page);
    await chooseChampion(page, 'perro', /golden/i);
    await page.getByRole('button', { name: '¡A jugar!' }).click();
    await page.clock.runFor(3_200);
    await page.clock.runFor(8_000);
    const before = Number(await page.getByTestId('time-left').textContent());
    expect(before).toBeLessThanOrEqual(22);

    // Gira a vertical.
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.clock.runFor(500);
    const after = Number(await page.getByTestId('time-left').textContent());
    expect(after).toBeLessThanOrEqual(before);
    expect(after).toBeGreaterThanOrEqual(before - 1);
    await expect(page.locator('canvas')).toHaveCount(1);
    await expect(page.getByTestId('champion')).toHaveCount(1);

    // El canvas se ajustó al nuevo tamaño y a la densidad de píxeles.
    const sizes = await page.locator('canvas').evaluate((c: HTMLCanvasElement) => ({
      css: c.getBoundingClientRect().width,
      px: c.width,
      dpr: window.devicePixelRatio,
    }));
    expect(Math.abs(sizes.px - Math.round(sizes.css * Math.min(2, sizes.dpr)))).toBeLessThanOrEqual(1);
    await page.screenshot({ path: 'test-results/capturas/rotacion-vertical.png' });

    // Vuelve a horizontal y la partida termina normalmente a los 30 s.
    await page.setViewportSize({ width: 1024, height: 768 });
    await runUntilTimeUp(page);
    await page.clock.runFor(2_000);
    await expect(page.getByTestId('result-screen')).toBeVisible();
    await expectNoHorizontalScroll(page);
  });
});
