import { describe, expect, it } from 'vitest';
import { findBreed, type CatLook } from '../config/breeds';

/** Relación de contraste WCAG entre dos colores hex. */
function luminance(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(a: string, b: string) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi! + 0.05) / (lo! + 0.05);
}

/** Fondos de las tarjetas de raza (normal y seleccionada) de cada marca; ver global.css. */
const CARD_BACKGROUNDS = {
  granplus: ['#FBF1DF', '#FFFFFF'],
  biofresh: ['#FFFFFF'],
};

describe('contraste de los gatos de pelaje claro', () => {
  for (const id of ['siames', 'persa']) {
    const look = findBreed(id)!.look as CatLook;

    for (const [brand, backgrounds] of Object.entries(CARD_BACKGROUNDS)) {
      it(`${id}: el contorno se distingue del fondo de la tarjeta en ${brand} (≥ 3:1)`, () => {
        expect(look.outline).toBeDefined();
        for (const bg of backgrounds) expect(contrast(look.outline!, bg)).toBeGreaterThanOrEqual(3);
      });
    }
  }

  it('el siamés conserva el cuerpo claro y la máscara, orejas y puntas oscuras', () => {
    const look = findBreed('siames')!.look as CatLook;
    expect(look.pattern).toBe('points');
    expect(contrast(look.fur, look.patternColor!)).toBeGreaterThanOrEqual(4.5);
  });

  it('el persa conserva el pelaje abundante y la cara redondeada', () => {
    const look = findBreed('persa')!.look as CatLook;
    expect(look.fluffy).toBe(true);
    expect(look.flatFace).toBe(true);
  });
});
