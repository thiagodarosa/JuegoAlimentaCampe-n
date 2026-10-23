import { expect, type Page } from '@playwright/test';

export const PARTICIPANT = {
  name: 'Ana Pereira',
  phone: '099 123 456',
  email: 'ana@correo.com',
};

export async function register(page: Page) {
  await page.getByLabel('Nombre completo').fill(PARTICIPANT.name);
  await page.getByLabel('Celular').fill(PARTICIPANT.phone);
  await page.getByLabel('Correo electrónico').fill(PARTICIPANT.email);
  await page.getByRole('checkbox', { name: /acepto la política de privacidad/i }).check({ force: true });
  await page.getByRole('button', { name: 'Continuar' }).click();
  await expect(page.getByRole('heading', { name: '¡Hola, Ana!' })).toBeVisible();
}

export async function chooseChampion(page: Page, species: 'perro' | 'gato', breed: RegExp) {
  await page.getByRole('button', { name: new RegExp(`mi campeón es un ${species}`, 'i') }).click();
  await page.getByRole('radio', { name: breed }).click();
  await page.getByRole('button', { name: /^¡vamos,/i }).click();
  await expect(page.getByRole('heading', { name: '¡Tu campeón te necesita!' })).toBeVisible();
}

/** La página no debe tener desplazamiento horizontal. */
export async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
}

/** Toca varios puntos del área de juego (el resultado depende de dónde haya objetos). */
export async function tapAround(page: Page, taps = 12) {
  const box = await page.locator('canvas').first().boundingBox();
  if (!box) throw new Error('Sin área de juego');
  for (let i = 0; i < taps; i++) {
    const x = box.x + box.width * (0.15 + ((i * 37) % 70) / 100);
    const y = box.y + box.height * (0.15 + ((i * 53) % 70) / 100);
    await page.mouse.click(x, y);
  }
}

/** Avanza el reloj de a poco hasta que aparece el cartel de fin de partida. */
export async function runUntilTimeUp(page: Page) {
  const banner = page.getByText('¡Tiempo!');
  for (let i = 0; i < 200; i++) {
    if (await banner.isVisible()) return;
    await page.clock.runFor(250);
  }
  throw new Error('La partida no terminó');
}

const T0 = new Date('2026-10-22T12:00:00-03:00').getTime();

/**
 * Abre la app con el reloj simulado y detenido: el tiempo solo avanza con
 * `page.clock.runFor()`, así las pruebas no dependen de la carga de la máquina.
 */
export async function openWithFrozenClock(page: Page) {
  await page.clock.install({ time: T0 });
  await page.goto('/');
  await page.clock.pauseAt(T0 + 60_000);
}

/** Igual, pero sobre una página ya abierta (por ejemplo, después de quedar sin conexión). */
export async function freezeClock(page: Page) {
  await page.clock.install({ time: T0 });
  await page.clock.pauseAt(T0 + 60_000);
}
