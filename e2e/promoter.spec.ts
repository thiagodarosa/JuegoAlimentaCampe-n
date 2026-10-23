import { expect, test } from '@playwright/test';
import { openWithFrozenClock } from './helpers';

test.describe('modo promotora', () => {
  test.beforeEach(({}, info) => test.skip(info.project.name !== 'escritorio', 'Se prueba una vez'));

  test('no hay botón visible y se abre con el atajo; el modo demo no pide datos', async ({ page }) => {
    await openWithFrozenClock(page);
    await expect(page.getByRole('button', { name: /promotora/i })).toHaveCount(0);

    await page.keyboard.press('Control+Shift+P');
    const panel = page.getByRole('dialog', { name: 'Modo promotora' });
    await expect(panel).toBeVisible();
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

  test('gesto táctil oculto: mantener el logo y tocar la esquina', async ({ page }) => {
    await openWithFrozenClock(page);
    const logo = page.getByRole('img', { name: 'GranPlus' }).first();
    const box = (await logo.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.clock.runFor(3_100);
    await page.mouse.up();
    const corner = page.getByRole('button', { name: 'Acceso de promotora' });
    await corner.click();
    await corner.click();
    await corner.click();
    await expect(page.getByRole('dialog', { name: 'Modo promotora' })).toBeVisible();
  });
});
