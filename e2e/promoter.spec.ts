import { expect, test } from '@playwright/test';
import { enterPromoterPin, openPromoterPanel, openWithFrozenClock } from './helpers';

test.describe('modo promotora', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'Se prueba una vez'));

  test('no hay botón visible; el atajo pide el PIN; el modo demo no pide datos', async ({ page }) => {
    await openWithFrozenClock(page);
    // La zona de acceso existe pero es invisible (sin texto ni fondo).
    const corner = page.getByRole('button', { name: 'Acceso de promotora' });
    await expect(corner).toHaveText('');
    await expect(corner).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

    const panel = await openPromoterPanel(page);
    await expect(panel).toContainText('No es un mecanismo de seguridad');

    // Configura los umbrales de medalla.
    await panel.getByLabel('Plata desde (puntos)').fill('0');
    await panel.getByLabel('Oro desde (puntos)').fill('5');
    await panel.getByLabel('Título').fill('¡Gracias por participar!');
    await panel.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(panel.getByText('Cambios guardados ✓')).toBeVisible();

    await panel.getByRole('button', { name: 'Jugar en modo demo' }).click();
    await expect(page.getByText(/modo demo/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: '¡Hola!' })).toBeVisible();

    await page.getByRole('button', { name: /mi campeón es un perro/i }).click();
    await page.getByRole('radio', { name: /salchicha/i }).click();
    await page.getByRole('button', { name: /vamos/i }).click();
    await page.getByRole('button', { name: '¡A jugar!' }).click();
    await page.clock.runFor(3_200 + 30_000 + 2_000);

    // Con plata desde 0, cualquier puntaje da al menos plata.
    await expect(page.getByRole('img', { name: /medalla de (plata|oro)/i })).toBeVisible();
    await page.getByRole('button', { name: 'Ver mi premio' }).click();
    await expect(page.getByRole('heading', { name: '¡Gracias por participar!' })).toBeVisible();
    await page.getByRole('button', { name: 'Finalizar' }).click();
    await expect(page.getByText(/modo demo/i)).toHaveCount(0);
  });

  test('6 toques en la esquina superior derecha piden el PIN y abren el panel', async ({ page }) => {
    await openWithFrozenClock(page);
    const { width } = page.viewportSize()!;
    const tap = () => page.mouse.click(width - 20, 20);

    for (let i = 0; i < 5; i++) await tap();
    await expect(page.getByRole('dialog', { name: 'Acceso de promotora' })).toHaveCount(0);
    await tap();

    // Un PIN incorrecto no abre el panel.
    await enterPromoterPin(page, '000000');
    await expect(page.getByRole('alert')).toContainText('PIN incorrecto');
    await expect(page.getByRole('dialog', { name: 'Modo promotora' })).toHaveCount(0);

    await enterPromoterPin(page);
    await expect(page.getByRole('dialog', { name: 'Modo promotora' })).toBeVisible();
  });

  test('la esquina inferior derecha ya no abre nada', async ({ page }) => {
    await openWithFrozenClock(page);
    const { width, height } = page.viewportSize()!;
    for (let i = 0; i < 6; i++) await page.mouse.click(width - 20, height - 20);
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });
});
