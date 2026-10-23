import { describe, expect, it } from 'vitest';
import { DEFAULT_SETTINGS } from '../config/game.config';
import { loadMetrics, recordGame } from './metrics';
import { loadSettings, medalFor, sanitizeSettings, saveSettings } from './settings';

describe('medallas', () => {
  const medals = { ...DEFAULT_SETTINGS.medals, silverFrom: 150, goldFrom: 300 };

  it.each([
    [0, 'bronce'],
    [149, 'bronce'],
    [150, 'plata'],
    [299, 'plata'],
    [300, 'oro'],
    [5000, 'oro'],
  ] as const)('%i puntos → %s', (score, medal) => {
    expect(medalFor(score, medals)).toBe(medal);
  });
});

describe('configuración', () => {
  it('usa valores por defecto si no hay nada guardado o está dañado', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem('granplus-campeon:settings:v1', '{no es json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('guarda y recupera cambios', () => {
    const s = structuredClone(DEFAULT_SETTINGS);
    s.medals.silverFrom = 120;
    s.prize.title = '¡Gracias!';
    saveSettings(s);
    expect(loadSettings().medals.silverFrom).toBe(120);
    expect(loadSettings().prize.title).toBe('¡Gracias!');
  });

  it('corrige umbrales inválidos', () => {
    const s = sanitizeSettings({ medals: { silverFrom: 200, goldFrom: 100 } });
    expect(s.medals.goldFrom).toBeGreaterThan(s.medals.silverFrom);
    expect(sanitizeSettings({ medals: { silverFrom: -5 } }).medals.silverFrom).toBe(DEFAULT_SETTINGS.medals.silverFrom);
  });

  it('no acepta textos vacíos', () => {
    expect(sanitizeSettings({ prize: { title: '   ' } }).prize.title).toBe(DEFAULT_SETTINGS.prize.title);
  });
});

describe('métricas anónimas', () => {
  it('solo guarda totales', () => {
    recordGame(120, 'bronce', 'perro');
    recordGame(320, 'oro', 'gato');
    const m = loadMetrics();
    expect(m).toEqual({
      games: 2,
      totalScore: 440,
      bestScore: 320,
      medals: { bronce: 1, plata: 0, oro: 1 },
      species: { perro: 1, gato: 1 },
    });
  });
});
