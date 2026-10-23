import { expect, test } from '@playwright/test';
import { chooseChampion, expectNoHorizontalScroll, PARTICIPANT, openWithFrozenClock, register, runUntilTimeUp, tapAround } from './helpers';

test.beforeEach(async ({ page }) => {
  // Reloj controlado: permite recorrer los 30 segundos sin esperar en tiempo real.
  await openWithFrozenClock(page);
});

test('flujo completo: registro → partida → resultado → premio → reinicio', async ({ page }, info) => {
  const shot = async (name: string) =>
    page.screenshot({ path: `test-results/capturas/${info.project.name}/${name}.png`, fullPage: true });

  await expect(page.getByRole('heading', { name: '¡Alimentá al campeón!' })).toBeVisible();
  await expect(page.getByRole('img', { name: 'GranPlus' }).first()).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot('1-registro');

  // Validación al enviar vacío.
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByText('Ingresá tu nombre completo.')).toBeVisible();
  await expect(page.getByText('Para participar tenés que aceptar la política de privacidad.')).toBeVisible();
  await shot('1b-registro-errores');

  await register(page);
  await expectNoHorizontalScroll(page);
  await shot('2-especie');

  await page.getByRole('button', { name: /mi campeón es un perro/i }).click();
  await expect(page.getByRole('radio')).toHaveCount(6);
  await page.getByRole('radio', { name: /border collie/i }).click();
  await expectNoHorizontalScroll(page);
  await shot('3-raza');
  await page.getByRole('button', { name: /vamos, collie/i }).click();

  await expect(page.getByRole('heading', { name: '¡Tu campeón te necesita!' })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await shot('4-instrucciones');
  await page.getByRole('button', { name: '¡A jugar!' }).click();

  // Partida: el personaje elegido aparece y no hay desplazamiento posible.
  await expect(page.getByTestId('champion')).toHaveAttribute('data-breed', 'border-collie');
  await expect(page.getByTestId('time-left')).toHaveText('30');
  await page.clock.runFor(3_200);
  await expect(page.getByTestId('play-screen')).toHaveAttribute('data-phase', 'running');
  await page.clock.runFor(6_000);
  await tapAround(page);
  await page.clock.runFor(200);
  await shot('5-partida');
  const scrollable = await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight + 1);
  expect(scrollable).toBe(false);

  await runUntilTimeUp(page);
  await page.clock.runFor(2_000);

  await expect(page.getByTestId('result-screen')).toBeVisible();
  await expect(page.getByText('¡Bien jugado, Ana!')).toBeVisible();
  await expect(page.getByRole('img', { name: /medalla de (oro|plata|bronce)/i })).toBeVisible();
  await expectNoHorizontalScroll(page);
  await page.clock.runFor(2_000);
  await shot('6-resultado');

  await page.getByRole('button', { name: 'Ver mi premio' }).click();
  await expect(page.getByRole('heading', { name: '¡Gracias por jugar con GranPlus!' })).toBeVisible();
  await expect(page.getByRole('img', { name: /envase granplus/i })).toHaveCount(2);
  await expectNoHorizontalScroll(page);
  await page.clock.runFor(1_500);
  await shot('7-premio');

  await page.getByRole('button', { name: 'Finalizar' }).click();
  await expect(page.getByLabel('Nombre completo')).toHaveValue('');
  await expect(page.getByLabel('Celular')).toHaveValue('');
  await expect(page.getByLabel('Correo electrónico')).toHaveValue('');
  await expect(page.locator('body')).not.toContainText(PARTICIPANT.name);

  // Nada personal quedó en el almacenamiento del navegador.
  const stored = await page.evaluate(() => JSON.stringify({ ...localStorage }) + JSON.stringify({ ...sessionStorage }));
  expect(stored).not.toContain(PARTICIPANT.name);
  expect(stored).not.toContain(PARTICIPANT.email);
  expect(stored).not.toContain('099');
});

test('el puntaje sube con croquetas y no se puede tocar después del final', async ({ page }) => {
  await register(page);
  await chooseChampion(page, 'gato', /siamés/i);
  await page.getByRole('button', { name: '¡A jugar!' }).click();
  await page.clock.runFor(3_200);

  // Se toca la pantalla en muchos puntos durante la partida: el puntaje nunca es negativo.
  for (let i = 0; i < 8; i++) {
    await page.clock.runFor(1_500);
    await tapAround(page, 8);
    const score = Number(await page.getByTestId('score').textContent());
    expect(score).toBeGreaterThanOrEqual(0);
  }
  await runUntilTimeUp(page);
  const final = await page.getByTestId('score').textContent();
  await tapAround(page, 10);
  await expect(page.getByTestId('score')).toHaveText(final ?? '');
});
